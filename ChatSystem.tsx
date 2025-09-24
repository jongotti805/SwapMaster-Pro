import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Phone,
  Video,
  Settings,
  Users,
  Hash,
  Lock,
  Image,
  Paperclip,
  Smile,
  MoreHorizontal,
  Search,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, uploadFile } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: string;
  created_by: string;
  participant_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  reply_to?: string;
  is_edited: boolean;
  created_at: string;
  // Joined data
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  last_seen: string;
  is_muted: boolean;
  // Joined data
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_online?: boolean;
  };
}

const ChatSystem: React.FC = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    type: 'public'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadChatRooms();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id);
      loadParticipants(selectedRoom.id);
      joinRoom(selectedRoom.id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatRooms(data || []);
      
      // Auto-select first room
      if (data && data.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0]);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!inner(id, username, display_name, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      
      const transformedMessages = data?.map(msg => ({
        ...msg,
        sender: msg.profiles
      })) || [];
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadParticipants = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          profiles!inner(id, username, display_name, avatar_url),
          user_online_status(is_online)
        `)
        .eq('room_id', roomId);

      if (error) throw error;
      
      const transformedParticipants = data?.map(participant => ({
        ...participant,
        user: {
          ...participant.profiles,
          is_online: participant.user_online_status?.[0]?.is_online || false
        }
      })) || [];
      
      setParticipants(transformedParticipants);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;

    try {
      // Add user to room participants if not already joined
      const { error } = await supabase
        .from('chat_participants')
        .upsert({
          room_id: roomId,
          user_id: user.id,
          role: 'member',
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'room_id,user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Load sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          const messageWithSender = {
            ...newMessage,
            sender: senderData
          };

          setMessages(prev => {
            // Only add if not already exists and belongs to current room
            if (selectedRoom && newMessage.room_id === selectedRoom.id && 
                !prev.find(msg => msg.id === newMessage.id)) {
              return [...prev, messageWithSender];
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Subscribe to room updates
    const roomsSubscription = supabase
      .channel('chat_rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          loadChatRooms();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      roomsSubscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;
      
      setNewMessage('');
      
      // Update room's last message timestamp
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedRoom.id);
        
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedRoom || !user) return;

    try {
      const fileUrl = await uploadFile(file, 'chat_files');
      
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: selectedRoom.id,
          sender_id: user.id,
          content: `Shared a file: ${file.name}`,
          message_type: file.type.startsWith('image/') ? 'image' : 'file',
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const createRoom = async () => {
    if (!user || !newRoomData.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoomData.name.trim(),
          description: newRoomData.description.trim(),
          type: newRoomData.type,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setNewRoomData({ name: '', description: '', type: 'public' });
      setShowCreateRoom(false);
      loadChatRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'private': return <Lock className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-slate-900 rounded-lg overflow-hidden">
      {/* Sidebar - Chat Rooms */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Community Chat</h2>
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Room Name</label>
                    <Input
                      value={newRoomData.name}
                      onChange={(e) => setNewRoomData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter room name"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Description</label>
                    <Textarea
                      value={newRoomData.description}
                      onChange={(e) => setNewRoomData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Room description (optional)"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <Button onClick={createRoom} className="w-full">
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search rooms..."
              className="pl-10 bg-slate-700 border-slate-600"
            />
          </div>
        </div>

        {/* Rooms List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chatRooms.map(room => (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => setSelectedRoom(room)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getRoomIcon(room.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{room.name}</h3>
                      <p className="text-sm opacity-70 truncate">
                        {room.description || `${room.participant_count || 0} members`}
                      </p>
                    </div>
                    {room.last_message_at && (
                      <div className="text-xs opacity-50">
                        {formatMessageTime(room.last_message_at)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRoomIcon(selectedRoom.type)}
                  <div>
                    <h3 className="font-semibold text-white">{selectedRoom.name}</h3>
                    <p className="text-sm text-slate-400">
                      {participants.length} members • {participants.filter(p => p.user?.is_online).length} online
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => {
                    const isOwn = message.sender_id === user?.id;
                    const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-[70%] ${
                          isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                        }`}>
                          {!isOwn && showAvatar && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender?.avatar_url} />
                              <AvatarFallback>
                                {message.sender?.display_name?.charAt(0) || message.sender?.username?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isOwn && !showAvatar && <div className="w-8" />}
                          
                          <div className={`rounded-lg p-3 ${
                            isOwn 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-700 text-slate-100'
                          }`}>
                            {!isOwn && showAvatar && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {message.sender?.display_name || message.sender?.username}
                              </p>
                            )}
                            
                            {message.message_type === 'image' && message.file_url ? (
                              <div className="space-y-2">
                                <img 
                                  src={message.file_url} 
                                  alt={message.file_name}
                                  className="max-w-full h-auto rounded"
                                />
                                <p className="text-sm">{message.content}</p>
                              </div>
                            ) : message.message_type === 'file' && message.file_url ? (
                              <div className="flex items-center space-x-2">
                                <Paperclip className="h-4 w-4" />
                                <a 
                                  href={message.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-300 hover:underline"
                                >
                                  {message.file_name}
                                </a>
                              </div>
                            ) : (
                              <p>{message.content}</p>
                            )}
                            
                            <p className={`text-xs mt-1 opacity-50`}>
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700 bg-slate-800">
              <div className="flex items-end space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="bg-slate-700 border-slate-600 resize-none min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">Select a chat room</h3>
              <p className="text-sm">Choose a room from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Participants Sidebar */}
      {selectedRoom && (
        <div className="w-64 bg-slate-800 border-l border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-semibold text-white">Members ({participants.length})</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {participants.map(participant => (
                <div
                  key={participant.id}
                  className="flex items-center space-x-3 p-2 rounded hover:bg-slate-700"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.user?.avatar_url} />
                      <AvatarFallback>
                        {participant.user?.display_name?.charAt(0) || participant.user?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {participant.user?.is_online && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-slate-800 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {participant.user?.display_name || participant.user?.username}
                    </p>
                    <p className="text-xs text-slate-400">{participant.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ChatSystem;