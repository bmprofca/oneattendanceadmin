import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save } from 'lucide-react';
import apiCall from '../utils/apiCall';
import { toast } from 'react-hot-toast';
import SelectField from '../components/common/SelectField';
import { useNavigate } from 'react-router-dom';

const inputClass = 'w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-colors';

const AlertConfig = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);
  
  const [formData, setFormData] = useState({
    alert_days_before: 5,
    alert_template_name: '',
    alert_template_vars: [],
    renewal_template_name: '',
    renewal_template_vars: [],
    is_renewal_enabled: false,
    is_alert_enabled: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const [configRes, templatesRes] = await Promise.all([
        apiCall('/subscriptions/alert-config'),
        apiCall('/subscriptions/whatsapp-templates')
      ]);

      const configData = await configRes.json();
      const templatesData = await templatesRes.json();

      if (templatesData.success && templatesData.data) {
        setTemplates(templatesData.data.filter(t => t.status === 'APPROVED'));
      }

      if (configData.success && configData.data) {
        setFormData({
          alert_days_before: configData.data.alert_days_before || 5,
          alert_template_name: configData.data.alert_template_name || '',
          alert_template_vars: configData.data.alert_template_vars || [],
          renewal_template_name: configData.data.renewal_template_name || '',
          renewal_template_vars: configData.data.renewal_template_vars || [],
          is_renewal_enabled: !!configData.data.is_renewal_enabled,
          is_alert_enabled: !!configData.data.is_alert_enabled
        });
      }
    } catch (error) {
      toast.error('Failed to load alert configuration');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        alert_days_before: Number(formData.alert_days_before),
        alert_template_name: formData.alert_template_name,
        alert_template_vars: (formData.alert_template_vars || []).filter(v => v && v.trim()),
        renewal_template_name: formData.renewal_template_name,
        renewal_template_vars: (formData.renewal_template_vars || []).filter(v => v && v.trim()),
        is_renewal_enabled: formData.is_renewal_enabled,
        is_alert_enabled: formData.is_alert_enabled
      };
      
      const response = await apiCall('/subscriptions/alert-config', 'PUT', payload);
      const data = await response.json();
      
      if (data.success) {
        toast.success('Alert configuration saved successfully');
      } else {
        toast.error(data.message || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const templateOptions = templates.map(t => ({
    value: t.template_name,
    label: t.template_name
  }));

  const handleTemplateChange = (fieldPrefix, opt) => {
    const templateName = opt ? opt.value : '';
    const template = templates.find(t => t.template_name === templateName);
    
    setFormData(prev => ({
      ...prev,
      [`${fieldPrefix}_name`]: templateName,
      [`${fieldPrefix}_vars`]: prev[`${fieldPrefix}_name`] === templateName ? prev[`${fieldPrefix}_vars`] : (template ? Array(template.variable_count).fill('') : [])
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <button onClick={() => navigate('/subscriptions')} className="hover:text-blue-600 transition-colors">Subscriptions</button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Alert Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            Alert Configuration
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure automated WhatsApp alerts for expiring subscriptions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-6">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading configuration...</div>
        ) : (
          <form id="alert-config-form" onSubmit={handleSubmit} className="space-y-8">
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl space-y-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Pre-Expiry Alerts</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Send WhatsApp notifications before a subscription expires.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_alert_enabled}
                    onChange={(e) => setFormData({ ...formData, is_alert_enabled: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {formData.is_alert_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Days Before Expiry</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.alert_days_before}
                      onChange={(e) => setFormData({ ...formData, alert_days_before: e.target.value })}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alert Template</label>
                    <SelectField
                      options={templateOptions}
                      value={templateOptions.find(o => o.value === formData.alert_template_name) || null}
                      onChange={(opt) => handleTemplateChange('alert_template', opt)}
                      placeholder="Select WhatsApp Template"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl space-y-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Renewal/Expired Notices</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Send WhatsApp notifications when a subscription has expired.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_renewal_enabled}
                    onChange={(e) => setFormData({ ...formData, is_renewal_enabled: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.is_renewal_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Renewal Template</label>
                    <SelectField
                      options={templateOptions}
                      value={templateOptions.find(o => o.value === formData.renewal_template_name) || null}
                      onChange={(opt) => handleTemplateChange('renewal_template', opt)}
                      placeholder="Select WhatsApp Template"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving || loading}
                className="px-6 py-2.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AlertConfig;
