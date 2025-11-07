(function () {
  var root = document.getElementById('l4p-dashboard-root');
  if (!root) {
    return;
  }

  var data = window.l4pDashboard || {};
  var isLoggedIn = !!(data.currentUser && data.currentUser.id);

  var wrapper = document.createElement('div');
  wrapper.style.padding = '32px';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  wrapper.style.maxWidth = '640px';
  wrapper.style.margin = '40px auto';
  wrapper.style.background = '#ffffff';
  wrapper.style.borderRadius = '16px';
  wrapper.style.boxShadow = '0 20px 45px rgba(15, 23, 42, 0.08)';
  wrapper.style.textAlign = 'center';

  var heading = document.createElement('h2');
  heading.textContent = 'Local 4 Picnic Manager';
  heading.style.fontSize = '1.75rem';
  heading.style.marginBottom = '16px';
  heading.style.color = '#0B5CD6';

  var body = document.createElement('p');
  body.style.fontSize = '1rem';
  body.style.lineHeight = '1.6';
  body.style.margin = '0 0 24px';
  body.style.color = '#1f2937';

  if (isLoggedIn) {
    body.innerHTML =
      'The production dashboard assets are not available in this build. ' +
      'Please run <code>npm install</code> followed by <code>npm run build</code> ' +
      'inside the <code>local-4-picnic-manager</code> directory to generate the compiled app.';
  } else {
    body.textContent = 'Please log in to view the Local Picnic dashboard.';
  }

  wrapper.appendChild(heading);
  wrapper.appendChild(body);

  root.innerHTML = '';
  root.appendChild(wrapper);
})();
