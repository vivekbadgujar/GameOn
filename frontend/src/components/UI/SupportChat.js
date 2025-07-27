import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, HelpCircle } from 'lucide-react';

const SupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const quickQuestions = [
    "How do I join a tournament?",
    "When will I receive my winnings?",
    "How to add money to wallet?",
    "Tournament rules and regulations"
  ];

  const handleQuickQuestion = (question) => {
    setMessage(question);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending logic here
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleDiscordRedirect = () => {
    window.open('https://discord.gg/gameon', '_blank');
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="support-chat"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 200 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-end p-6"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-card w-full max-w-md h-96 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Support Chat</h3>
                    <p className="text-xs text-white/60">We're here to help!</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Chat Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                {/* Welcome Message */}
                <div className="mb-4">
                  <div className="bg-blue-500/20 rounded-lg p-3 mb-3">
                    <p className="text-white text-sm">
                      👋 Hi there! How can we help you today?
                    </p>
                  </div>
                </div>

                {/* Quick Questions */}
                <div className="mb-4">
                  <p className="text-white/80 text-sm mb-3">Quick questions:</p>
                  <div className="space-y-2">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuestion(question)}
                        className="w-full text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors duration-300"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discord Option */}
                <div className="bg-indigo-500/20 rounded-lg p-3 mb-4">
                  <p className="text-white text-sm mb-2">
                    💬 For faster support, join our Discord community!
                  </p>
                  <button
                    onClick={handleDiscordRedirect}
                    className="btn-primary w-full text-sm py-2"
                  >
                    Join Discord
                  </button>
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 input-field text-sm py-2"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="btn-primary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-2">
                  We typically respond within 5 minutes
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChat;