import React from 'react';
import ReactDOM from 'react-dom/client';
import CoachDashboard from './coach/CoachDashboard';
import ClientLoader from './components/ClientLoader';
import App from './App';

const isCoach = window.location.pathname.startsWith('/coach');

function Root() {
  if (isCoach) return <CoachDashboard />;
  return (
    <ClientLoader>
      {({ clientData, adaptedSchedule }) => (
        <App clientData={clientData} adaptedSchedule={adaptedSchedule} />
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
