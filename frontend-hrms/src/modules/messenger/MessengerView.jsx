import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Circle,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const MessengerView = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeContactId, setActiveContactId] = useState("c-1");
  const [messageInput, setMessageInput] = useState("");

  const contacts = [
    {
      id: "c-1",
      name: "Kennedy Welch",
      role: "Computer Analyst",
      avatar: "KW",
      status: "online",
      time: "1m ago",
      lastMessage: "Sure, sending the revised CTC structure now...",
      unread: 2,
    },
    {
      id: "c-2",
      name: "Vikramaditya Singh",
      role: "VP Engineering",
      avatar: "VS",
      status: "online",
      time: "15m ago",
      lastMessage: "I approved the Muster Roll for Unit 2.",
      unread: 0,
    },
    {
      id: "c-3",
      name: "Meera Sen",
      role: "Talent Acquisition Lead",
      avatar: "MS",
      status: "offline",
      time: "1h ago",
      lastMessage: "New senior frontend engineer candidate pipeline updated.",
      unread: 0,
    },
    {
      id: "c-4",
      name: "Aarav Sharma",
      role: "Operations Executive",
      avatar: "AS",
      status: "online",
      time: "3h ago",
      lastMessage: "Biometric clock-in issue resolved for factory gate #4.",
      unread: 0,
    },
    {
      id: "c-5",
      name: "Shreya Mukherjee",
      role: "Candidate (Offer Stage)",
      avatar: "SM",
      status: "offline",
      time: "1d ago",
      lastMessage: "Thank you for the formal offer letter!",
      unread: 0,
    },
  ];

  const [messages, setMessages] = useState({
    "c-1": [
      {
        id: "m-1",
        sender: "Kennedy Welch",
        text: "Hi Pooja, could you check the onboarding checklist for the new backend hires?",
        time: "10:14 AM",
        isSelf: false,
      },
      {
        id: "m-2",
        sender: "Pooja Verma",
        text: "Checked! The IT asset provisioning and PF declarations are all set.",
        time: "10:18 AM",
        isSelf: true,
      },
      {
        id: "m-3",
        sender: "Kennedy Welch",
        text: "Sure, sending the revised CTC structure now...",
        time: "10:22 AM",
        isSelf: false,
      },
    ],
  });

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0];
  const currentMessages = messages[activeContactId] || [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: user?.fullName || "Pooja Verma",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSelf: true,
    };

    setMessages((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMsg],
    }));

    setMessageInput("");
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[550px]">
      {/* Left Pane: Contacts List matching reference screenshot */}
      <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-white">
        {/* Search header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Contacts Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredContacts.map((contact) => {
            const isActive = contact.id === activeContactId;

            return (
              <div
                key={contact.id}
                onClick={() => setActiveContactId(contact.id)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50/90 to-blue-50/20 border-l-3 border-blue-600"
                    : "hover:bg-slate-50/80"
                }`}
              >
                {/* Avatar with status indicator */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                    {contact.avatar}
                  </div>
                  {contact.status === "online" && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? "text-blue-950 font-bold" : "text-slate-800"
                      }`}
                    >
                      {contact.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {contact.time}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {contact.role}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-1">
                    {contact.lastMessage}
                  </div>
                </div>

                {contact.unread > 0 && (
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 self-center">
                    {contact.unread}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Active Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              {activeContact.avatar}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {activeContact.name}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeContact.role} • Active now
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <button className="p-2 hover:bg-slate-50 rounded-xl hover:text-slate-700">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-slate-50 rounded-xl hover:text-slate-700">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-slate-50 rounded-xl hover:text-slate-700">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.isSelf ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.isSelf
                    ? "bg-blue-600 text-white rounded-br-xs shadow-xs"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-xs shadow-2xs"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.time}
              </span>
            </div>
          ))}
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder={`Message ${activeContact.name}...`}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessengerView;
