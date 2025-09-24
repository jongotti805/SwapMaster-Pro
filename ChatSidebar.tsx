import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Users,
  Phone,
  Video,
  Search,
  Settings,
  X,
  Hash,
  Lock,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'vehicle_specific';
  vehicle_specific?: string;
  participant_count: number;
  last_message_at?: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  reply_to_id?: string;
  reactions: Record<string, string[]>;
  is_edited: boolean;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    is_online: boolean;
  };
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat rooms
  useEffect(() => {
    if (!user) return;

    loadChatRooms();
    setupRealtimeSubscriptions();
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants!inner(
            user_id,
            role,
            last_read_at
          )
        `)
        .eq('chat_participants.user_id', user?.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      setRooms(data || []);
      
      // Auto-select first room if available
      if (data && data.length > 0 && !activeRoom) {
        setActiveRoom(data[0]);
        loadMessages(data[0].id);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles!chat_messages_sender_id_fkey(
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender: {
          id: msg.profiles?.user_id || msg.sender_id,
          display_name: msg.profiles?.display_name || 'Unknown User',
          avatar_url: msg.profiles?.avatar_url,
          is_online: onlineUsers.includes(msg.sender_id)
        }
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          if (payload.new.room_id === activeRoom?.id) {
            // Fetch sender info and add message
            const { data: senderData } = await supabase
              .from('profiles')
              .select('user_id, display_name, avatar_url')
              .eq('user_id', payload.new.sender_id)
              .maybeSingle();

            const newMessage = {
              ...payload.new,
              sender: {
                id: senderData?.user_id || payload.new.sender_id,
                display_name: senderData?.display_name || 'Unknown User',
                avatar_url: senderData?.avatar_url,
                is_online: onlineUsers.includes(payload.new.sender_id)
              }
            } as ChatMessage;

            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    // Subscribe to online status changes
    const statusSubscription = supabase
      .channel('user_online_status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_online_status'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const userId = payload.new.user_id;
            const isOnline = payload.new.is_online;
            
            setOnlineUsers(prev => {
              if (isOnline && !prev.includes(userId)) {
                return [...prev, userId];
              } else if (!isOnline) {
                return prev.filter(id => id !== userId);
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      statusSubscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: activeRoom.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      
      // Update room's last message time
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeRoom.id);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleRoomSelect = (room: ChatRoom) => {
    setActiveRoom(room);
    loadMessages(room.id);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'vehicle_specific':
        return <Hash className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-slate-900/95 backdrop-blur-lg border-l border-slate-700 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-white">Chat</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Room List */}
        <div className="w-32 border-r border-slate-700 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {rooms.map((room) => (
                <Button
                  key={room.id}
                  variant={activeRoom?.id === room.id ? "secondary" : "ghost"}
                  className="w-full h-12 flex flex-col items-center justify-center p-1 text-xs"
                  onClick={() => handleRoomSelect(room)}
                >
                  {getRoomIcon(room)}
                  <span className="truncate w-full text-center mt-1">
                    {room.vehicle_specific || room.name}
                  </span>
                  {room.unread_count && room.unread_count > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs p-0 flex items-center justify-center">
                      {room.unread_count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{activeRoom.name}</h4>
                    <p className="text-xs text-slate-400">
                      {activeRoom.participant_count} members
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-start space-x-2 ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.sender_id !== user?.id && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.sender?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {message.sender?.display_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[70%] rounded-lg p-2 ${
                              message.sender_id === user?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-white'
                            }`}
                          >
                            {message.sender_id !== user?.id && (
                              <p className="text-xs text-slate-300 mb-1">
                                {message.sender?.display_name}
                              </p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 border-t border-slate-700">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-800 border-slate-600"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a chat room to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatSidebar;