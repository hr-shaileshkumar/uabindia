const http = require('http');

http.get('http://localhost:5000/api/v1/auth/csrf-token', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('CSRF response:', data);
    });
});
