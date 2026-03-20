self.addEventListener('install', (e) => {
    self.skipWaiting();
});
self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).catch(() => new Response('Offline mode'))
    );
});
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// 定期唤醒以防止完全冻结
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'keep-alive') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
                clients.forEach(client => client.postMessage('ping'));
            })
        );
    }
});
