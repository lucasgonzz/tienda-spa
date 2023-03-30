import firebase from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import "firebase/messaging"
import Cookies from "js-cookie"
export default {
    methods: {
        checkNotificationsPermissions() {
            setTimeout(() => {
                console.log("Notification in window: ")
                console.log("Notification" in window)
                if (("Notification" in window) && Notification.permission != 'granted' && this.route_name != 'Maps') {
                    console.log('se va a mostrar notifications-permissions modal')
                    this.$bvModal.show('notifications-permissions')
                }
                console.log('estado de las notificaciones: ')
                console.log(Notification.permission)
            }, 3000)
        },
        runFirebase() {
            if (this.authenticated && Notification.permission == 'granted') {
                this.initializeFirebase();
            }
        },
        registerToken(token) {
            this.$api.post("register-token", {
                token: token
            }).then(response => {
                console.log('token registrado')
                console.log(response)
            })
            .catch(err => {
                console.log(err)
            })
        },
        initializeFirebase() {
            if (firebase.messaging.isSupported()) {
                let config = {
                    apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
					authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
					projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
					messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
					appId: process.env.VUE_APP_FIREBASE_APP_ID,
                };
                let fire = firebase.initializeApp(config);
                // getAnalytics(fire)
                const messaging = firebase.messaging();

                messaging.getToken()
                    .then((token) => {
                        this.registerToken(token)
                    })
                    .catch((err) => {
                        console.log('An error occurred while retrieving token. ', err);
                    });

                messaging.onMessage(function (payload) {
                    console.log("Message received", payload);
                    let n = new Notification("New Recipe alert!")
                });
            }
        }
    }
};