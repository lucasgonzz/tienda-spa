importScripts("https://www.gstatic.com/firebasejs/7.8.2/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/7.8.2/firebase-messaging.js");

// FIREBASE KIOSCO VERDE
// var apiKey = 'AIzaSyB--yFdom7wzHTDY_9T1ufruKMhlTb94-I'
// var authDomain = 'kiosco-verde.firebaseapp.com'
// var projectId = 'kiosco-verde'
// var messagingSenderId = '249690269593'
// var appId = '1:249690269593:web:8daeb86662123f16d95508'
// var storageBucket = 'kiosco-verde.appspot.com'
// var measurementId = 'G-3F1KPN1TJC'
// var logo_url = 'https://kioscoverde.com/img/logo.739ff85d.png'

// FIREBASE FIUSHH
var apiKey = 'AIzaSyCYVGxiL5gdsmhRiPbuKnMwaJ8fO7G7YZM'
var authDomain = 'fiushh.firebaseapp.com'
var projectId = 'fiushh'
var messagingSenderId = '454337397326'
var appId = '1:454337397326:web:6bac80f70b2a7098e3f91f'
var storageBucket = 'fiushh.appspot.com'
var measurementId = 'G-4LS07FV2LY'
var logo_url = 'https://fiushh.com/img/logo.e6a74f19.png'

let config = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
};
firebase.initializeApp(config);
const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler(function (res) {
    console.log(res.data);
    console.log(res.data.twi_title);
    let title = res.data.twi_title,
    options = {
        body: res.data.twi_body,
        icon: logo_url
    };
    console.log(options)
    return self.registration.showNotification(
        title,
        options
    );
});