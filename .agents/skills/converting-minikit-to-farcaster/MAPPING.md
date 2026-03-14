\# MiniKit to Farcaster SDK Mapping

Complete reference for converting each MiniKit hook to Farcaster SDK calls.

\## Table of Contents

\- \[Import Changes\](#import-changes)
\- \[useMiniKit\](#useminikit)
\- \[useClose\](#useclose)
\- \[useOpenUrl\](#useopenurl)
\- \[useViewProfile\](#useviewprofile)
\- \[useViewCast\](#useviewcast)
\- \[useComposeCast\](#usecomposecast)
\- \[useAddFrame\](#useaddframe)
\- \[useAuthenticate\](#useauthenticate)
\- \[useNotification\](#usenotification)

\-\-\-

\## Import Changes

\### Before (MiniKit)
\`\`\`typescript
import {
 useMiniKit,
 useClose,
 useOpenUrl,
 useViewProfile,
 useViewCast,
 useComposeCast,
 useAddFrame,
 useAuthenticate
} from '@coinbase/onchainkit/minikit';
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';
\`\`\`

\*\*Note\*\*: All hooks become direct SDK method calls. No React hooks needed.

\-\-\-

\## useMiniKit

The main hook that provides context and ready signal.

\### Before (MiniKit)
\`\`\`typescript
import { useMiniKit } from '@coinbase/onchainkit/minikit';

function App() {
 const { setFrameReady, isFrameReady, context } = useMiniKit();

 useEffect(() => {
 if (!isFrameReady) {
 setFrameReady();
 }
 }, \[setFrameReady, isFrameReady\]);

 // Access user info
 const userFid = context?.user?.fid;
 const username = context?.user?.username;

 return

Hello {username}

;
}
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';

function App() {
 const \[isReady, setIsReady\] = useState(false);
 const \[context, setContext\] = useState(null);

 useEffect(() => {
 const init = async () => {
 // Get context first (must await - it's a Promise)
 const context = await sdk.context;
 setContext(context);

 // Signal ready to hide splash screen
 await sdk.actions.ready();
 setIsReady(true);
 };
 init();
 }, \[\]);

 // Access user info
 const userFid = context?.user?.fid;
 const username = context?.user?.username;

 return

Hello {username}

;
}
\`\`\`

\### Context Structure (Same for Both)
\`\`\`typescript
type MiniAppContext = {
 user: {
 fid: number;
 username?: string;
 displayName?: string;
 pfpUrl?: string;
 };
 client: {
 clientFid: number;
 added: boolean;
 notificationDetails?: {
 url: string;
 token: string;
 };
 safeAreaInsets?: {
 top: number;
 bottom: number;
 left: number;
 right: number;
 };
 };
 location?: LocationContext;
};
\`\`\`

\-\-\-

\## useClose

Closes the mini app.

\### Before (MiniKit)
\`\`\`typescript
import { useClose } from '@coinbase/onchainkit/minikit';

function CloseButton() {
 const close = useClose();

 return Close App;
}
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';

function CloseButton() {
 const handleClose = async () => {
 await sdk.actions.close();
 };

 return Close App;
}
\`\`\`

\-\-\-

\## useOpenUrl

Opens an external URL in the browser.

\### Before (MiniKit)
\`\`\`typescript
import { useOpenUrl } from '@coinbase/onchainkit/minikit';

function LinkButton() {
 const openUrl = useOpenUrl();

 const handleClick = () => {
 openUrl('https://example.com');
 };

 return Visit Site;
}
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';

function LinkButton() {
 const handleClick = async () => {
 await sdk.actions.openUrl('https://example.com');
 };

 return Visit Site;
}
\`\`\`

\-\-\-

\## useViewProfile

Opens a Farcaster user's profile.

\### Before (MiniKit)
\`\`\`typescript
import { useViewProfile } from '@coinbase/onchainkit/minikit';

function ProfileLink({ fid }) {
 const viewProfile = useViewProfile();

 const handleClick = () => {
 viewProfile(fid);
 };

 return View Profile;
}
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';

function ProfileLink({ fid }) {
 const handleClick = async () => {
 await sdk.actions.viewProfile({ fid });
 };

 return View Profile;
}
\`\`\`

\*\*Note\*\*: The SDK requires an object with \`fid\` property, not just the fid directly.

\-\-\-

\## useViewCast

Opens a specific cast.

\### Before (MiniKit)
\`\`\`typescript
import { useViewCast } from '@coinbase/onchainkit/minikit';

function CastLink({ hash }) {
 const viewCast = useViewCast();

 const handleClick = () => {
 viewCast(hash);
 };

 return View Cast;
}
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';

function CastLink({ hash }) {
 const handleClick = async () => {
 await sdk.actions.viewCast({ hash });
 };

 return View Cast;
}
\`\`\`

\-\-\-

\## useComposeCast

Opens the cast composer with prefilled content.

\### Before (MiniKit)
\`\`\`typescript
import { useComposeCast } from '@coinbase/onchainkit/minikit';

function ShareButton() {
 const { composeCast } = useComposeCast();

 const handleShare = () => {
 composeCast({
 text: 'Check out this app!',
 embeds: \['https://myapp.com'\]
 });
 };

 return Share;
}
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';

function ShareButton() {
 const handleShare = async () => {
 const result = await sdk.actions.composeCast({
 text: 'Check out this app!',
 embeds: \['https://myapp.com'\]
 });

 // result.cast contains the posted cast if successful
 if (result?.cast) {
 console.log('Cast posted:', result.cast.hash);
 }
 };

 return Share;
}
\`\`\`

\### Full Options
\`\`\`typescript
await sdk.actions.composeCast({
 text: string; // Suggested text (user can modify)
 embeds?: string\[\]; // URLs to embed (max 2)
 parent?: { // Reply to a cast
 hash: string;
 };
 channelKey?: string; // Post to a channel
 close?: boolean; // Close app after posting
});
\`\`\`

\-\-\-

\## useAddFrame

Prompts user to add/save the mini app.

\### Before (MiniKit)
\`\`\`typescript
import { useAddFrame } from '@coinbase/onchainkit/minikit';

function SaveButton() {
 const addFrame = useAddFrame();

 const handleAdd = async () => {
 const result = await addFrame();
 if (result) {
 console.log('Added! Token:', result.token);
 // Save result.url and result.token for notifications
 }
 };

 return Save App;
}
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';

function SaveButton() {
 const handleAdd = async () => {
 const result = await sdk.actions.addMiniApp();
 if (result) {
 console.log('Added! Token:', result.token);
 // Save result.url and result.token for notifications
 }
 };

 return Save App;
}
\`\`\`

\-\-\-

\## useAuthenticate

Authenticates the user with Sign In with Farcaster.

\### Before (MiniKit)
\`\`\`typescript
import { useAuthenticate } from '@coinbase/onchainkit/minikit';

function AuthButton() {
 const authenticate = useAuthenticate();

 const handleAuth = async () => {
 const result = await authenticate();
 if (result) {
 // Send result to your backend for verification
 await verifyOnBackend(result);
 }
 };

 return Sign In;
}
\`\`\`

\### After (Farcaster SDK)
\`\`\`typescript
import { sdk } from '@farcaster/miniapp-sdk';

function AuthButton() {
 const handleAuth = async () => {
 const result = await sdk.actions.signIn({
 // Optional: specify nonce for verification
 nonce: 'your-random-nonce'
 });

 if (result) {
 // result contains signature for verification
 await verifyOnBackend(result);
 }
 };

 return Sign In;
}
\`\`\`

\*\*Important\*\*: Always verify the signature on your backend for security-critical operations.

\-\-\-

\## useNotification

Notifications require server-side implementation. See \[NOTIFICATIONS.md\](NOTIFICATIONS.md) for details.

\### Before (MiniKit)
\`\`\`typescript
import { useNotification } from '@coinbase/onchainkit/minikit';

function NotifyButton() {
 const sendNotification = useNotification();

 const handleNotify = async () => {
 await sendNotification({
 title: 'Hello!',
 body: 'You have a new message'
 });
 };

 return Send Test;
}
\`\`\`

\### After (Farcaster SDK)
Notifications are sent via webhook from your server, not from the client.

\`\`\`typescript
// Client: Just trigger your backend
function NotifyButton() {
 const handleNotify = async () => {
 await fetch('/api/send-notification', {
 method: 'POST',
 body: JSON.stringify({
 title: 'Hello!',
 body: 'You have a new message'
 })
 });
 };

 return Send Test;
}
\`\`\`

See \[NOTIFICATIONS.md\](NOTIFICATIONS.md) for server-side implementation.