import React, { useState } from 'react';
import { User, Mail, Phone, Lock, ShieldCheck, Trash2, Globe, Monitor, LogOut, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const ProfileSettings = () => {
  const [profile, setProfile] = useState({
    name: 'Kaunain Ahmad',
    email: 'ahmad@example.com',
    mobile: '+91 98765 43210',
    currency: 'INR'
  });

  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    // Mock API call
    toast.success('Profile updated successfully!');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match!');
      return;
    }
    toast.success('Password changed successfully!');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          {/* Header with Avatar Initials */}
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 uppercase tracking-wider text-sm font-semibold">Premium Member</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your profile information and security preferences.</p>
        </div>

        {/* Profile Information */}
        <motion.section variants={containerVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <User className="w-5 h-5" />
              <h2>Personal Information</h2>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="email@example.com" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input 
                    type="tel" 
                    value={profile.mobile}
                    onChange={(e) => setProfile({...profile, mobile: e.target.value})}
                    className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="+91 XXXXX XXXXX" 
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Update Profile
            </button>
          </form>
        </motion.section>

        {/* User Preferences */}
        <motion.section variants={containerVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Globe className="w-5 h-5" />
              <h2>Preferences</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="max-w-sm">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Currency</label>
              <select 
                value={profile.currency}
                onChange={(e) => setProfile({...profile, currency: e.target.value})}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">This will affect how your total net worth is calculated.</p>
            </div>
          </div>
        </motion.section>

        {/* Security Section */}
        <motion.section variants={containerVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Lock className="w-5 h-5" />
              <h2>Security</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMfaModalOpen(true)}
                className="text-blue-600 font-medium hover:underline"
              >Enable</button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                <input 
                  type="password" 
                  required
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  placeholder="Current Password" 
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" 
                />
                <input 
                  type="password" 
                  required
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  placeholder="New Password" 
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" 
                />
                <input 
                  type="password" 
                  required
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  placeholder="Confirm New Password" 
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" 
                />
                <button type="submit" className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </motion.section>

        {/* Session Management */}
        <motion.section variants={containerVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Monitor className="w-5 h-5" />
              <h2>Active Sessions</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full"><Monitor className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Current Session — Chrome on Linux</p>
                  <p className="text-sm text-gray-500">192.168.1.1</p>
                </div>
              </div>
              <button className="text-red-600 text-sm font-medium flex items-center gap-1 hover:underline">
                <LogOut className="w-4 h-4" /> Logout all other devices
              </button>
            </div>
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section variants={containerVariants} className="bg-red-50 dark:bg-red-900/10 rounded-xl shadow-sm border border-red-200 dark:border-red-900/30 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-400 mb-2">
              <Trash2 className="w-5 h-5" />
              <h2>Danger Zone</h2>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >Delete Account</button>
          </div>
        </motion.section>
      </div>

      {/* MFA Setup Modal */}
      <AnimatePresence>
        {isMfaModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold dark:text-white">MFA Setup</h3>
                <button onClick={() => setIsMfaModalOpen(false)}><X size={20} className="dark:text-white" /></button>
              </div>
              <div className="space-y-4 text-center">
                <div className="bg-gray-100 p-4 rounded-lg inline-block">
                  <div className="w-32 h-32 bg-gray-300 animate-pulse rounded" /> {/* QR Placeholder */}
                </div>
                <p className="text-sm text-gray-500">Scan this QR code with Google Authenticator and enter the code below.</p>
                <input type="text" placeholder="000000" className="text-center text-2xl tracking-widest w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                <button 
                  onClick={() => { toast.success('MFA Enabled!'); setIsMfaModalOpen(false); }}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg"
                >Verify & Enable</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border-t-4 border-red-500"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="text-red-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">Are you absolutely sure?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone. This will permanently delete your account and remove all your investment data.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg"
                  >Cancel</button>
                  <button 
                    onClick={() => { toast.error('Account Deleted.'); navigate('/login'); }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg shadow-red-500/30"
                  >Delete</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileSettings;