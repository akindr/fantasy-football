// Polyfills for Node.js core modules
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer and process available globally
window.Buffer = Buffer;
window.process = process;

// Add any other polyfills needed for the application
if (typeof (window as any).global === 'undefined') {
    (window as any).global = window;
}
