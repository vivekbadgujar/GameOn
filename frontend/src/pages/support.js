import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  ChevronDown,
  ChevronUp,
  Send,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Trophy,
  CreditCard,
  Shield
} from 'lucide-react';

const Support = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const categories = [
    { id: 'general', name: 'General', icon: HelpCircle },
    { id: 'tournaments', name: 'Tournaments', icon: Trophy },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'account', name: 'Account', icon: Users },
    { id: 'technical', name: 'Technical', icon: Shield }
  ];

  const faqs = {
    general: [
      {
        question: 'What is GameOn?',
        answer: 'GameOn is India\'s premier gaming tournament platform where players can participate in competitive tournaments for popular games like BGMI, VALORANT, Chess, and more. Win real cash prizes and compete with the best players across the country.'
      },
      {
        question: 'How do I get started?',
        answer: 'Simply create an account using your phone number, verify your account, add funds to your wallet, and start joining tournaments. It\'s that easy!'
      },
      {
        question: 'Is GameOn safe and secure?',
        answer: 'Yes, GameOn uses industry-standard security measures to protect your data and transactions. All payments are processed through secure payment gateways, and we never store your payment information.'
      },
      {
        question: 'What games are available?',
        answer: 'We currently support BGMI, VALORANT, Chess, Free Fire, and COD Mobile. We\'re constantly adding new games based on community demand.'
      }
    ],
    tournaments: [
      {
        question: 'How do I join a tournament?',
        answer: 'Browse available tournaments, click on the one you want to join, pay the entry fee (if applicable), and you\'re registered! Make sure to join the tournament lobby 15 minutes before the start time.'
      },
      {
        question: 'What happens if I miss the tournament start time?',
        answer: 'If you miss the start time, you may be disqualified from the tournament. Entry fees are typically non-refundable for no-shows. We recommend joining the lobby at least 15 minutes early.'
      },
      {
        question: 'How are winners determined?',
        answer: 'Winners are determined based on the tournament format and game rules. Results are usually automated through game APIs, but may be manually verified for certain tournaments.'
      },
      {
        question: 'When do I receive my winnings?',
        answer: 'Winnings are typically credited to your GameOn wallet within 24 hours of tournament completion. You can then withdraw the funds to your bank account or UPI.'
      }
    ],
    payments: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept UPI payments (PhonePe, GPay, Paytm), debit cards, credit cards, and net banking. All payments are processed securely through trusted payment gateways.'
      },
      {
        question: 'How do I add money to my wallet?',
        answer: 'Go to the Wallet section, click "Add Funds", choose your preferred payment method, enter the amount, and complete the payment. Funds are usually added instantly.'
      },
      {
        question: 'How do I withdraw my winnings?',
        answer: 'Go to the Wallet section, click "Withdraw", enter the amount you want to withdraw, choose your withdrawal method (UPI or bank transfer), and submit. Withdrawals are processed within 24-48 hours.'
      },
      {
        question: 'Are there any fees for transactions?',
        answer: 'We don\'t charge any fees for adding money to your wallet. Withdrawal fees may apply depending on the method chosen and amount withdrawn.'
      }
    ],
    account: [
      {
        question: 'How do I verify my account?',
        answer: 'Account verification is done through phone number OTP during registration. For additional verification, you may need to provide identity documents for higher withdrawal limits.'
      },
      {
        question: 'Can I change my username?',
        answer: 'Yes, you can change your username from the Profile section. Note that username changes may be limited to once per month.'
      },
      {
        question: 'How do I reset my password?',
        answer: 'GameOn uses OTP-based authentication, so there are no traditional passwords. Simply use the "Login" option and verify with OTP sent to your registered phone number.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can request account deletion by contacting our support team. Please note that this action is irreversible and you\'ll lose access to your tournament history and any remaining wallet balance.'
      }
    ],
    technical: [
      {
        question: 'The website is not loading properly',
        answer: 'Try clearing your browser cache and cookies, or try using a different browser. If the issue persists, check your internet connection or contact our technical support.'
      },
      {
        question: 'I\'m having trouble joining a tournament lobby',
        answer: 'Make sure you have the latest version of the game installed and a stable internet connection. Check if the tournament has specific requirements or room codes that need to be entered.'
      },
      {
        question: 'My game results are not showing correctly',
        answer: 'Game results are usually updated automatically. If there\'s a discrepancy, please contact support with screenshots or proof of your performance within 24 hours of the tournament.'
      },
      {
        question: 'I\'m experiencing lag or connection issues',
        answer: 'Ensure you have a stable internet connection with good ping. Close other applications that might be using bandwidth. If issues persist, try switching to a different network or contact your ISP.'
      }
    ]
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', contactForm);
    setFormSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormSubmitted(false);
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
    }, 3000);
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gradient">Help & Support</span>
          </h1>
          <p className="text-white/60 text-lg max-w-3xl mx-auto">
            Get help with tournaments, payments, account issues, and more. 
            We're here to ensure you have the best gaming experience.
          </p>
        </motion.div>

        {/* Quick Help Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Chat</h3>
            <p className="text-white/60 mb-4">Get instant help from our support team</p>
            <button className="btn-primary w-full">
              Start Chat
            </button>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Discord Community</h3>
            <p className="text-white/60 mb-4">Join our Discord for community support</p>
            <button 
              onClick={() => window.open('https://discord.gg/gameon', '_blank')}
              className="btn-secondary w-full"
            >
              Join Discord
            </button>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Response Time</h3>
            <p className="text-white/60 mb-4">Average response time: 5 minutes</p>
            <div className="text-green-400 font-semibold">
              ● Online Now
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setExpandedFAQ(null);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                        activeCategory === category.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* FAQ Items */}
              <div className="space-y-4">
                {faqs[activeCategory]?.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="faq-item"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="faq-header w-full text-left flex items-center justify-between"
                    >
                      <h3 className="font-semibold text-white pr-4">{faq.question}</h3>
                      {expandedFAQ === index ? (
                        <ChevronUp className="w-5 h-5 text-white/60 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/60 flex-shrink-0" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedFAQ === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="faq-content"
                        >
                          <p className="leading-relaxed">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Contact Support</h2>
              
              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-white/60">
                    We'll get back to you within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-3">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={contactForm.name}
                      onChange={handleFormChange}
                      placeholder="Your full name"
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleFormChange}
                      placeholder="your.email@example.com"
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Category</label>
                    <select
                      name="category"
                      value={contactForm.category}
                      onChange={handleFormChange}
                      className="input-field w-full"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleFormChange}
                      placeholder="Brief description of your issue"
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Message</label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleFormChange}
                      placeholder="Describe your issue in detail..."
                      rows="5"
                      className="input-field w-full resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass-card p-6 mt-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">Other Ways to Reach Us</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Email</p>
                    <p className="text-white/60 text-sm">support@gameon.com</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Phone</p>
                    <p className="text-white/60 text-sm">+91 8488956724</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Discord</p>
                    <p className="text-white/60 text-sm">Giving Soon</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-400 font-semibold text-sm">Support Hours</p>
                    <p className="text-white/80 text-sm">
                      Monday - Friday : 9:00 AM - 11:00 PM IST
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}
