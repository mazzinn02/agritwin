import React, { useState } from 'react';
import { DigitalTwinCropState, Alert } from '../types';
import { ShieldAlert, TrendingDown, Droplet, Wind, CheckCircle2, AlertTriangle, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { sendEmail } from '../lib/gmail';

interface Props {
  twinState: DigitalTwinCropState;
}

const getSeverityStyles = (severity: Alert['severity']) => {
  switch (severity) {
    case 'critical': return 'bg-red-50 border-red-200 text-red-800';
    case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'medium': return 'bg-amber-50 border-amber-200 text-amber-800';
    case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
    default: return 'bg-slate-50 border-slate-200 text-slate-800';
  }
};

const getIcon = (type: Alert['type'], severity: Alert['severity']) => {
  const iconClass = 'w-6 h-6 shrink-0 mt-0.5';
  switch (type) {
    case 'disease': return <ShieldAlert className={`${iconClass} ${severity === 'critical' ? 'text-red-500' : 'text-orange-500'}`} />;
    case 'growth': return <TrendingDown className={`${iconClass} text-amber-500`} />;
    case 'moisture': return <Droplet className={`${iconClass} text-blue-500`} />;
    case 'environmental': return <Wind className={`${iconClass} text-slate-500`} />;
    default: return <AlertCircle className={`${iconClass} text-slate-500`} />;
  }
};

export const AlertsNotifications: React.FC<Props> = ({ twinState }) => {
  const alerts = twinState.alerts || [];
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleEmailReport = async () => {
    const confirmed = window.confirm(
      `Send a Digital Twin Alerts Report with ${alerts.length} alert(s) to your Gmail inbox?`
    );
    if (!confirmed) return;

    setIsSendingEmail(true);
    try {
      const subject = `AgriTwin Report: ${alerts.length} Active Alerts`;
      
      let htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <h2 style="color: #047857;">AgriTwin Digital Twin Status</h2>
          <p>Current Crop Health Score: <strong>${twinState.healthScore}%</strong></p>
          <p>You have <strong>${alerts.length}</strong> active alerts that need your attention.</p>
          <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
      `;

      if (alerts.length === 0) {
        htmlBody += `<p>All clear! No alerts currently active.</p>`;
      } else {
        alerts.forEach(alert => {
          let color = '#64748b';
          if (alert.severity === 'critical') color = '#b91c1c';
          else if (alert.severity === 'high') color = '#c2410c';
          else if (alert.severity === 'medium') color = '#b45309';

          htmlBody += `
            <div style="background-color: #f8fafc; border-left: 4px solid ${color}; padding: 12px; margin-bottom: 12px;">
              <strong style="text-transform: uppercase; font-size: 12px; color: ${color};">${alert.severity} PRIORITY - ${alert.type}</strong>
              <p style="margin: 8px 0 4px 0;">${alert.message}</p>
              <small style="color: #64748b;">${alert.timestamp}</small>
            </div>
          `;
        });
      }

      htmlBody += `
        </div>
      `;

      await sendEmail(subject, htmlBody);
      alert("Alerts report sent successfully to your Gmail inbox!");
    } catch (error: any) {
      console.error(error);
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Alerts & Notifications</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleEmailReport}
            disabled={isSendingEmail}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 text-blue-600" />}
            <span>Email Report</span>
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            Filter
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            Mark all read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">All Clear</h3>
            <p className="text-slate-500 mt-1">No active alerts for this crop.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 flex items-start space-x-4 transition-colors ${alert.isRead ? 'opacity-70 bg-slate-50' : 'bg-white hover:bg-slate-50/50'}`}>
                {getIcon(alert.type, alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className={`text-base font-medium ${alert.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                      {alert.message}
                    </p>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {alert.timestamp}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${getSeverityStyles(alert.severity)}`}>
                      {alert.severity} priority
                    </span>
                    <span className="text-sm text-slate-500 capitalize">{alert.type} alert</span>
                  </div>
                </div>
                {!alert.isRead && (
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
