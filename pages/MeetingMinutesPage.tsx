import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Calendar, Edit3, Save, Download, Share2,
  Trash2, Plus, ChevronRight, Clock, Users, CheckCircle,
  Copy, Sparkles
} from 'lucide-react';
import { 
  saveMinutes, 
  getAllMinutes, 
  getMinutesForMeeting,
  deleteMinutes,
  getMinutesTemplates,
  generateMinutesFromMeeting,
  exportMinutesAsPDF,
  shareMinutes,
  MeetingMinutes
} from '../lib/meetingMinutes';
import toast from 'react-hot-toast';

export const MeetingMinutesPage: React.FC = () => {
  const { t } = useLanguage();
  const { meetings, members } = useData();
  const { user } = useAuth();
  
  const [allMinutes, setAllMinutes] = useState<MeetingMinutes[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    setAllMinutes(getAllMinutes());
  }, []);

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
  const selectedMinutes = selectedMeetingId ? getMinutesForMeeting(selectedMeetingId) : null;

  const handleSelectMeeting = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    const existing = getMinutesForMeeting(meetingId);
    if (existing) {
      setEditContent(existing.content);
    } else {
      setEditContent('');
    }
    setIsEditing(false);
  };

  const handleGenerateMinutes = (templateId: string) => {
    if (!selectedMeeting) return;

    const template = getMinutesTemplates().find(t => t.id === templateId);
    if (!template) return;

    const absentees = members
      .filter(m => !selectedMeeting.attendees.includes(m.id))
      .map(m => m.name);

    const content = generateMinutesFromMeeting({
      date: selectedMeeting.date,
      attendees: selectedMeeting.attendees,
      absentees,
      savingsCollected: Object.values(selectedMeeting.savingsCollected).reduce((a, b) => a + b, 0),
      loanRepayments: Object.values(selectedMeeting.loanRecovered || {}).reduce((a, b) => a + b, 0),
      finesCollected: Object.values(selectedMeeting.finesCollected || {}).reduce((a, b) => a + b, 0),
      totalCollected: selectedMeeting.totalCollected
    }, template);

    setEditContent(content);
    setIsEditing(true);
    setShowTemplates(false);
    toast.success('Minutes generated!', { icon: '✨' });
  };

  const handleSaveMinutes = () => {
    if (!selectedMeetingId || !editContent.trim()) {
      toast.error('Please add content');
      return;
    }

    saveMinutes({
      meetingId: selectedMeetingId,
      content: editContent,
      createdBy: user?.name || 'Unknown'
    });

    setAllMinutes(getAllMinutes());
    setIsEditing(false);
    toast.success('Minutes saved!', { icon: '📝' });
  };

  const handleDeleteMinutes = (id: string) => {
    deleteMinutes(id);
    setAllMinutes(getAllMinutes());
    setEditContent('');
    toast.success('Minutes deleted');
  };

  const handleExport = () => {
    if (selectedMinutes) {
      exportMinutesAsPDF(selectedMinutes);
    }
  };

  const handleShare = () => {
    if (selectedMinutes) {
      shareMinutes(selectedMinutes);
    }
  };

  const handleCopy = () => {
    if (editContent) {
      navigator.clipboard.writeText(editContent);
      toast.success('Copied to clipboard!', { icon: '📋' });
    }
  };

  const templates = getMinutesTemplates();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 min-h-screen"
    >
      <Header 
        title="Meeting Minutes" 
        subtitle="Record & share meeting notes"
        showProfile={false}
      />

      <div className="px-6 space-y-6">
        {/* Meeting Selector */}
        {!selectedMeetingId ? (
          <div className="space-y-4">
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider">Select a Meeting</h3>
            
            {meetings.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center">
                <Calendar className="mx-auto mb-3 text-white/20" size={48} />
                <p className="text-white/40">No meetings found</p>
                <p className="text-white/20 text-sm mt-1">Complete a meeting first to add minutes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting, index) => {
                  const hasMinutes = allMinutes.some(m => m.meetingId === meeting.id);
                  return (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectMeeting(meeting.id)}
                      className="glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Calendar className="text-blue-400" size={24} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{meeting.date}</h4>
                        <div className="flex items-center gap-3 text-white/40 text-xs mt-1">
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {meeting.attendees.length} present
                          </span>
                          <span className="flex items-center gap-1">
                            ₹{meeting.totalCollected.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasMinutes && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            <CheckCircle size={12} className="inline mr-1" />
                            Minutes
                          </span>
                        )}
                        <ChevronRight className="text-white/20" size={20} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedMeetingId(null);
                setEditContent('');
                setIsEditing(false);
              }}
              className="text-blue-400 text-sm flex items-center gap-1"
            >
              ← Back to meetings
            </button>

            {/* Meeting Info */}
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Calendar className="text-blue-400" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white">{selectedMeeting?.date}</h4>
                <p className="text-white/40 text-xs">
                  {selectedMeeting?.attendees.length} present • ₹{selectedMeeting?.totalCollected.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!isEditing && !selectedMinutes && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Generate Minutes
                </button>
              )}
              
              {!isEditing && selectedMinutes && (
                <>
                  <button
                    onClick={() => {
                      setEditContent(selectedMinutes.content);
                      setIsEditing(true);
                    }}
                    className="flex-1 bg-white/10 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} />
                    Edit
                  </button>
                  <button onClick={handleExport} className="p-3 bg-white/10 rounded-xl">
                    <Download size={18} className="text-white" />
                  </button>
                  <button onClick={handleShare} className="p-3 bg-white/10 rounded-xl">
                    <Share2 size={18} className="text-white" />
                  </button>
                </>
              )}

              {isEditing && (
                <>
                  <button
                    onClick={handleSaveMinutes}
                    className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Save
                  </button>
                  <button onClick={handleCopy} className="p-3 bg-white/10 rounded-xl">
                    <Copy size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(selectedMinutes?.content || '');
                    }}
                    className="p-3 bg-white/10 rounded-xl text-white"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter meeting minutes..."
                className="w-full h-[400px] bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 font-mono text-sm resize-none"
              />
            ) : selectedMinutes ? (
              <div className="glass-panel p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white/50 text-xs">
                    <Clock size={14} />
                    Last updated: {new Date(selectedMinutes.updatedAt || selectedMinutes.createdAt).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleDeleteMinutes(selectedMinutes.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-white/80 text-sm font-sans leading-relaxed">
                    {selectedMinutes.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-2xl text-center">
                <FileText className="mx-auto mb-3 text-white/20" size={48} />
                <p className="text-white/40">No minutes recorded</p>
                <p className="text-white/20 text-sm mt-1">Generate or write minutes for this meeting</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      <AnimatePresence>
        {showTemplates && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplates(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#1C1C1E] border-t border-white/10 rounded-t-3xl p-6"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              
              <h3 className="text-xl font-bold text-white mb-4">Choose Template</h3>

              <div className="space-y-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleGenerateMinutes(template.id)}
                    className="w-full glass-panel p-4 rounded-2xl text-left hover:bg-white/5 transition-colors"
                  >
                    <h4 className="font-bold text-white">{template.name}</h4>
                    <p className="text-white/40 text-sm mt-1">
                      {template.sections.slice(0, 4).join(' • ')}
                      {template.sections.length > 4 && ` +${template.sections.length - 4} more`}
                    </p>
                  </button>
                ))}

                <button
                  onClick={() => {
                    setEditContent('# Meeting Minutes\n\n');
                    setIsEditing(true);
                    setShowTemplates(false);
                  }}
                  className="w-full glass-panel p-4 rounded-2xl text-left hover:bg-white/5 transition-colors border border-dashed border-white/20"
                >
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Plus size={18} />
                    Start from Scratch
                  </h4>
                  <p className="text-white/40 text-sm mt-1">Write your own minutes</p>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
