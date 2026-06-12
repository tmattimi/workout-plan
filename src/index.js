import React from 'react';
import ReactDOM from 'react-dom/client';
import CoachDashboard from './coach/CoachDashboard';
import ClientLoader from './components/ClientLoader';
import App from './App';
import { launchSurface } from './lib/env';

// Surface (coach vs client) is decided in one place — see launchSurface() in
// lib/env.js. On web this reads the URL path (/coach); native overrides there.
const isCoach = launchSurface() === 'coach';

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
