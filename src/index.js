import React from 'react';
import ReactDOM from 'react-dom/client';
import CoachDashboard from './coach/CoachDashboard';
import ClientLoader from './components/ClientLoader';
import App from './App';

const path = window.location.pathname;
const hash = window.location.hash;

// /coach -> coach dashboard
const isCoach = path.startsWith('/coach');

// Password setup/reset — Supabase puts tokens in the URL hash
const isPasswordSetup = hash.includes('access_token') || 
                        hash.includes('type=invite') || 
                        hash.includes('type=recovery');

function Root() {
  if (isCoach) return <CoachDashboard />;
  return (
    <ClientLoader>
      {({ clientData, adaptedSchedule, onSignOut }) => (
        <App 
          clientData={clientData} 
          adaptedSchedule={adaptedSchedule}
          onSignOut={onSignOut}
        />
      )}
    </ClientLoader>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  );
}
