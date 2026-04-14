import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Lock, ShieldCheck, Trash2, Globe, Monitor, LogOut, X, AlertTriangle, Camera, CheckCircle, Copy, Download, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../utils/api';
import { useUser } from '../hooks/useUser';
import { getInitials } from '../utils/stringUtils';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ConfirmDialog from '../components/ConfirmDialog';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, refreshUser } = useUser();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    currency: 'INR',
    avatarUrl: ''
  });

  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDisableMfaModalOpen, setIsDisableMfaModalOpen] = useState(false);
  const [isConfirmRegenerateOpen, setIsConfirmRegenerateOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState([]);

  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('User data updated:', { email: user.email, mfaEnabled: user.mfaEnabled });
      setProfile({
        name: user.name || '',
        email: user.email || '',
        mobile: user.phone || '',
        currency: user.currency || 'INR',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (isMfaModalOpen && !mfaSetupData) {
      fetchMfaSetup();
    }
  }, [isMfaModalOpen]);

  const fetchMfaSetup = async () => {
    try {
      setMfaLoading(true);
      const res = await authAPI.setupMfa();
      setMfaSetupData(res.data);
    } catch (error) {
      toast.error('Failed to initialize MFA setup');
      setIsMfaModalOpen(false);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Updating personal information...');
    try {
      await userAPI.updateProfile({
        name: profile.name,
        phone: profile.mobile,
        currency: profile.currency
      });
      await refreshUser();
      toast.success('Profile updated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update profile', { id: loadingToast });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
      toast.error('Image size should be less than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const loadingToast = toast.loading('Uploading avatar...');
    try {
      const res = await userAPI.uploadAvatar(formData);
      await refreshUser();
      setProfile(prev => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      toast.success('Avatar updated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to upload avatar', { id: loadingToast });
    }
  };

  const handleEnableMfa = async () => {
    if (mfaCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    const loadingToast = toast.loading('Enabling MFA...');
    try {
      await authAPI.enableMfa(mfaCode);
      
      // Add a small delay to ensure backend has updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch updated user data
      await refreshUser();
      
      // Additional refresh to ensure UI updates with latest mfaEnabled value
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success('Two-Factor Authentication enabled!', { id: loadingToast });
      setIsMfaModalOpen(false);
      setMfaCode('');
    } catch (error) {
      toast.error('Invalid verification code', { id: loadingToast });
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    setIsConfirmRegenerateOpen(false);
    const loadingToast = toast.loading('Regenerating recovery codes...');
    try {
      const res = await authAPI.regenerateRecoveryCodes();
      setNewRecoveryCodes(res.data);
      toast.success('Recovery codes regenerated!', { id: loadingToast });
      setIsRegenerateModalOpen(true);
    } catch (error) {
      console.error('Regeneration error:', error);
      toast.error('Failed to regenerate recovery codes', { id: loadingToast });
    }
  };

  const handleDisableMfa = async () => {
    const loadingToast = toast.loading('Disabling MFA...');
    try {
      await authAPI.disableMfa();
      
      // Add a small delay to ensure backend has updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch updated user data
      await refreshUser();
      
      // Additional refresh to ensure UI updates with latest mfaEnabled value
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success('Two-Factor Authentication disabled', { id: loadingToast });
      setIsDisableMfaModalOpen(false);
    } catch (error) {
      console.error('Disable MFA error:', error);
      toast.error('Failed to disable MFA', { id: loadingToast });
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('mfa-qr-canvas');
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "fincz-mfa-backup.png";
      link.href = url;
      link.click();
      toast.info('QR code downloaded for backup');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  if (userLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-transform group-hover:scale-105 overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(profile.name || profile.email)
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white w-6 h-6" />
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Your Name" 
                />
              </div>
            </div>
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
                <ShieldCheck className={`w-6 h-6 ${user?.mfaEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.mfaEnabled ? 'Your account is protected with 2FA.' : 'Add an extra layer of security to your account.'}
                  </p>
                </div>
              </div>
              {!user?.mfaEnabled && (
                <button 
                  onClick={() => setIsMfaModalOpen(true)}
                  className="text-blue-600 font-medium hover:underline"
                >Enable</button>
              )}
              {user?.mfaEnabled && (
                <div className="flex items-center gap-4">
                  <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                    <CheckCircle size={14} /> Active
                  </span>
                  <button 
                    onClick={() => setIsConfirmRegenerateOpen(true)}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >Regenerate Codes</button>
                  <button 
                    onClick={() => setIsDisableMfaModalOpen(true)}
                    className="text-red-600 text-sm font-medium hover:underline"
                  >Disable</button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Account Password</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Regularly changing your password improves account security.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-blue-600 font-medium hover:underline"
              >
                Update
              </button>
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
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold dark:text-white">MFA Setup</h3>
                </div>
                <button onClick={() => setIsMfaModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-700 dark:text-white" /></button>
              </div>
              {mfaLoading ? (
                <div className="py-12 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Generating secure secret...</p>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-lg inline-block border border-gray-200 shadow-sm">
                    {mfaSetupData?.qrCodeUrl && (
                      <QRCodeCanvas 
                        id="mfa-qr-canvas"
                        value={mfaSetupData.qrCodeUrl}
                        size={128}
                        level={"H"}
                        includeMargin={false}
                      />
                    )}
                  </div>
                    <button 
                      onClick={downloadQRCode}
                      className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                    >
                      <Download size={14} /> Download QR Code Image
                    </button>
                  </div>
                  <div className="text-left bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Secret Key</p>
                    <div className="flex items-center justify-between font-mono text-sm dark:text-white">
                      <span>{mfaSetupData?.secret}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(mfaSetupData?.secret);
                          toast.success('Secret copied to clipboard');
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {mfaSetupData?.recoveryCodes && (
                    <div className="text-left bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-2">Recovery Codes (Save these safely!)</p>
                      <div className="grid grid-cols-2 gap-1 font-mono text-[10px] dark:text-white">
                        {mfaSetupData.recoveryCodes.map((code, idx) => (
                          <span key={idx}>{code}</span>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(mfaSetupData.recoveryCodes.join('\n'));
                          toast.success('Recovery codes copied');
                        }}
                        className="mt-2 text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Copy size={10} /> Copy all codes
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 text-left">
                    Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) or enter the secret key manually.
                  </p>
                  <input 
                    type="text" 
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000" 
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-bold w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none p-2" 
                  />
                  <button 
                    onClick={handleEnableMfa}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                  >Verify & Enable</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Regenerated Recovery Codes Modal */}
      <AnimatePresence>
        {isRegenerateModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold dark:text-white">New Recovery Codes</h3>
                </div>
                <button onClick={() => setIsRegenerateModalOpen(false)}><X size={20} className="text-gray-500 hover:text-gray-700 dark:text-white" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="text-left bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase">Save these safely! Old codes are now invalid.</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm dark:text-white">
                    {newRecoveryCodes.map((code, idx) => (
                      <span key={idx}>{code}</span>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(newRecoveryCodes.join('\n'));
                      toast.success('Recovery codes copied');
                    }}
                    className="mt-4 w-full py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors text-sm font-semibold"
                  >
                    <Copy size={16} /> Copy all codes
                  </button>
                </div>
                <button 
                  onClick={() => setIsRegenerateModalOpen(false)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  I have saved these codes
                </button>
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

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      <ConfirmDialog
        isOpen={isConfirmRegenerateOpen}
        onClose={() => setIsConfirmRegenerateOpen(false)}
        onConfirm={handleRegenerateRecoveryCodes}
        title="Regenerate Recovery Codes?"
        confirmText="Regenerate"
      >
        Are you sure you want to regenerate your recovery codes? This will <span className="font-bold text-red-600 dark:text-red-400">immediately invalidate</span> all your current codes. Make sure you are ready to save the new ones.
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={isDisableMfaModalOpen}
        onClose={() => setIsDisableMfaModalOpen(false)}
        onConfirm={handleDisableMfa}
        title="Disable 2FA?"
        confirmText="Disable"
      >
        Are you sure you want to disable Two-Factor Authentication? Your account will be less secure and you will only need your password to log in.
      </ConfirmDialog>
    </motion.div>
  );
};

export default ProfileSettings;