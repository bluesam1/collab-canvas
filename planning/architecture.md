graph TB
    subgraph "Client Browser"
        subgraph "React Application"
            Main[main.tsx<br/>Entry Point]
            App[App.tsx<br/>Root + ErrorBoundary]
            
            subgraph "Context Providers"
                UserCtx[UserContext<br/>Auth State & User Color]
                CanvasCtx[CanvasContext<br/>Objects State & Selection]
                PresenceCtx[PresenceContext<br/>Cursors & Online Users]
            end
            
            subgraph "Custom Hooks"
                useAuth[useAuth Hook<br/>Login/Logout/State]
                useCanvas[useCanvas Hook<br/>CRUD Operations]
                usePresence[usePresence Hook<br/>Cursor & Presence Ops]
            end
            
            subgraph "Components"
                subgraph "Auth Components"
                    Login[Login.tsx<br/>Email Link + Google]
                    AuthProvider[AuthProvider.tsx<br/>Auth Gate]
                end
                
                subgraph "Canvas Layer"
                    Canvas[Canvas.tsx<br/>Konva Stage<br/>Pan/Zoom/Events]
                    Rectangle[Rectangle.tsx<br/>Draggable Shapes]
                    Cursor[Cursor.tsx<br/>Remote Cursors + Labels]
                end
                
                subgraph "UI Layer"
                    Toolbar[Toolbar.tsx<br/>Top-Left]
                    ColorPalette[ColorPalette.tsx<br/>5 Colors]
                    DeleteBtn[DeleteButton.tsx]
                    OnlineUsers[OnlineUsers.tsx<br/>Top-Right]
                    UserIndicator[UserIndicator.tsx<br/>Colored Dots]
                end
            end
            
            subgraph "Utilities & Config"
                FirebaseConfig[firebase.ts<br/>SDK Init + Config]
                FirebaseUtils[firebase.ts utils<br/>Write Helpers]
                Colors[colors.ts<br/>5-Color Palette<br/>Random Assignment]
            end
        end
        
        Konva[Konva.js Library<br/>60 FPS Canvas Rendering]
    end
    
    subgraph "Firebase Realtime Listeners"
        subgraph "Listener 1: Objects"
            ObjListener["onValue(ref, 'objects')<br/>→ CanvasContext<br/>Sync: Create/Update/Delete<br/>Cleanup: off() on unmount"]
        end
        
        subgraph "Listener 2: Cursors"
            CursorListener["onValue(ref, 'presence')<br/>→ PresenceContext<br/>Throttled: 50ms updates<br/>Cleanup: off() on unmount"]
        end
        
        subgraph "Listener 3: Presence"
            PresenceListener["onValue(ref, 'presence')<br/>→ PresenceContext<br/>onDisconnect() handlers<br/>Cleanup: off() + cancel onDisconnect"]
        end
    end
    
    subgraph "Firebase Backend Services"
        subgraph "Firebase Authentication"
            EmailLink[Email Link Auth<br/>Passwordless Magic Link]
            GoogleAuth[Google Sign-In<br/>OAuth 2.0]
        end
        
        subgraph "Firebase Realtime Database"
            ObjectsDB["Database Path:<br/>/objects/objectId<br/>---<br/>type: 'rectangle'<br/>x, y, width, height<br/>fill color<br/>createdBy, timestamps"]
            
            PresenceDB["Database Path:<br/>/presence/userId<br/>---<br/>email, color<br/>cursor: x, y<br/>isOnline, lastActive"]
            
            UsersDB["Database Path:<br/>/users/userId<br/>---<br/>email<br/>createdAt timestamp"]
        end
        
        SecurityRules["database.rules.json<br/>Auth Required for All Paths<br/>Objects: Full CRUD<br/>Presence: Owner Write<br/>Users: Owner Write"]
        
        Hosting[Firebase Hosting<br/>CDN + SSL<br/>Deploy: firebase deploy]
    end
    
    subgraph "Testing Suite"
        AuthTests[tests/auth.test.tsx<br/>Email Link + Google Auth]
        CanvasTests[tests/canvas.test.tsx<br/>Create/Select/Move/Delete]
        SyncTests[tests/sync.test.tsx<br/>Listener Setup/Cleanup<br/>Real-time Sync<br/>Last Write Wins]
        PresenceTests[tests/presence.test.tsx<br/>Cursor Updates<br/>Online/Offline<br/>Listener Cleanup]
    end
    
    subgraph "Other Users Browser 2..N"
        OtherClients[Connected Clients<br/>Real-time Bidirectional Sync]
    end
    
    %% Main Application Flow
    Main --> App
    App --> AuthProvider
    AuthProvider --> UserCtx
    App --> CanvasCtx
    App --> PresenceCtx
    
    %% Context to Hooks
    UserCtx --> useAuth
    CanvasCtx --> useCanvas
    PresenceCtx --> usePresence
    
    %% Auth Flow
    AuthProvider --> Login
    Login --> useAuth
    useAuth --> FirebaseConfig
    FirebaseConfig --> EmailLink
    FirebaseConfig --> GoogleAuth
    EmailLink -.->|User Profile| UsersDB
    GoogleAuth -.->|User Profile| UsersDB
    
    %% Canvas Rendering Flow
    AuthProvider --> Canvas
    Canvas --> Rectangle
    Canvas --> Cursor
    Canvas --> Konva
    Rectangle --> Konva
    Cursor --> Konva
    
    %% Toolbar Integration
    Canvas --> Toolbar
    Toolbar --> ColorPalette
    Toolbar --> DeleteBtn
    ColorPalette --> Colors
    DeleteBtn --> useCanvas
    
    %% Online Users Integration
    Canvas --> OnlineUsers
    OnlineUsers --> UserIndicator
    UserIndicator --> Colors
    
    %% Firebase Listener Setup - Objects
    CanvasCtx -->|"useEffect: Setup Listener"| ObjListener
    ObjListener -->|"Listen to"| ObjectsDB
    ObjectsDB -->|"Real-time Updates<br/><100ms"| ObjListener
    ObjListener -->|"Update State"| CanvasCtx
    CanvasCtx -.->|"Cleanup: off()"| ObjListener
    
    %% Firebase Listener Setup - Cursors
    PresenceCtx -->|"useEffect: Setup Listener"| CursorListener
    CursorListener -->|"Listen to"| PresenceDB
    PresenceDB -->|"Cursor Updates<br/><50ms"| CursorListener
    CursorListener -->|"Update cursors Map"| PresenceCtx
    PresenceCtx -.->|"Cleanup: off()"| CursorListener
    
    %% Firebase Listener Setup - Presence
    PresenceCtx -->|"useEffect: Setup Listener"| PresenceListener
    PresenceListener -->|"Listen to + onDisconnect()"| PresenceDB
    PresenceDB -->|"Online/Offline Events"| PresenceListener
    PresenceListener -->|"Update onlineUsers Map"| PresenceCtx
    PresenceCtx -.->|"Cleanup: off() + cancel"| PresenceListener
    
    %% Write Operations
    useCanvas -->|"Write: set() / update()"| FirebaseUtils
    FirebaseUtils -->|"Create/Update/Delete"| ObjectsDB
    
    usePresence -->|"Throttled Write: set()"| FirebaseUtils
    FirebaseUtils -->|"Cursor Position<br/>Every 50ms"| PresenceDB
    
    usePresence -->|"Write: set() + onDisconnect()"| PresenceDB
    
    %% Multi-user Sync
    ObjectsDB <-->|"Bidirectional Sync"| OtherClients
    PresenceDB <-->|"Bidirectional Sync"| OtherClients
    
    %% Security
    SecurityRules -.->|Protects| ObjectsDB
    SecurityRules -.->|Protects| PresenceDB
    SecurityRules -.->|Protects| UsersDB
    
    %% Testing
    AuthTests -.->|Tests| useAuth
    CanvasTests -.->|Tests| useCanvas
    SyncTests -.->|Tests| ObjListener
    SyncTests -.->|Tests| ObjectsDB
    PresenceTests -.->|Tests| CursorListener
    PresenceTests -.->|Tests| PresenceListener
    
    %% Deployment
    Hosting -.->|Serves| Main
    
    %% Styling
    classDef firebase fill:#FFA611,stroke:#333,stroke-width:2px,color:#000
    classDef listener fill:#FF6B6B,stroke:#333,stroke-width:3px,color:#000
    classDef context fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    classDef component fill:#98D8C8,stroke:#333,stroke-width:2px,color:#000
    classDef testing fill:#A78BFA,stroke:#333,stroke-width:2px,color:#000
    classDef external fill:#E0E0E0,stroke:#333,stroke-width:2px,color:#000
    
    class EmailLink,GoogleAuth,ObjectsDB,PresenceDB,UsersDB,SecurityRules,Hosting firebase
    class ObjListener,CursorListener,PresenceListener listener
    class UserCtx,CanvasCtx,PresenceCtx context
    class Canvas,Rectangle,Cursor,Toolbar,OnlineUsers component
    class AuthTests,CanvasTests,SyncTests,PresenceTests testing
    class Konva,OtherClients external