import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../config/constants';

class WebSocketService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.subscriptions = [];
        this.onConnectCallbacks = [];
    }

    connect(onConnected) {
        if (this.connected) {
            if (onConnected) onConnected();
            return;
        }

        // URL pointing to the Spring Boot backend
        const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || `${API_BASE_URL}/ws-game`;

        this.client = new Client({
            // Use SockJS as the underlying WebSocket
            webSocketFactory: () => new SockJS(socketUrl),
            debug: (str) => {
                // Uncomment to see STOMP debugging
                // console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
        });

        this.client.onConnect = (frame) => {
            this.connected = true;
            console.log('Connected to WebSocket via STOMP');
            if (onConnected) onConnected();
            
            // Execute any delayed subscriptions
            this.onConnectCallbacks.forEach(cb => cb());
            this.onConnectCallbacks = [];
        };

        this.client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
        }
        this.connected = false;
        console.log('Disconnected from WebSocket');
    }

    subscribe(topic, callback) {
        if (!this.connected) {
            // Queue subscription until connected
            this.onConnectCallbacks.push(() => this.subscribe(topic, callback));
            return null;
        }
        
        const subscription = this.client.subscribe(topic, (message) => {
            if (message.body) {
                callback(JSON.parse(message.body));
            }
        });
        
        this.subscriptions.push(subscription);
        return subscription;
    }

    sendMessage(destination, body) {
        if (this.client && this.connected) {
            this.client.publish({
                destination: destination,
                body: JSON.stringify(body)
            });
        } else {
            console.warn("WebSocket not connected, dropping message to " + destination);
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
