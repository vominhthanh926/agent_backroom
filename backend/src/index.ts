import {Server} from 'socket.io';
import {getDatabaseVitualsBackroom} from './utilities';
import {ChangeStreamDocument} from 'mongodb';
import {createServer} from "http";


const server = createServer()
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || '*.ondigitalocean.app'
        : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

server.listen(4000, () => {
  console.log('Server is listening on port 4000');
});

let changeStreamInitialized = false;

io.on('connection', (socket) => {
  const sessionId = socket.handshake.auth.sessionId;

  if (sessionId) {
    socket.data.sessionId = sessionId;
    console.log('Reconnected client with session ID:', sessionId);
  } else {
    console.log('New client connected:', socket.id);
  }

  console.log("Done", changeStreamInitialized)

  // Only setup change stream once
  if (!changeStreamInitialized) {
    setupChangeStream().then(r => console.log("SetupChangeStream is running"));
    changeStreamInitialized = true;
  }
});

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setupChangeStream() {
  let dbChangeStream;
  try {
    const db = await getDatabaseVitualsBackroom();
    const collections = await db.listCollections().toArray();
    const sortedCollections = collections.sort((a, b) => b.name.localeCompare(a.name));
    dbChangeStream = db.watch();
    let latestCollectionName = sortedCollections[0].name;

    dbChangeStream.on('change', (change: ChangeStreamDocument<any>) => {
      console.log(JSON.stringify(change));
      if (change.operationType === 'insert' && 'fullDocument' in change && 'ns' in change) {
        const currentCollection = change.ns.coll;
        console.log(latestCollectionName, currentCollection, latestCollectionName.localeCompare(currentCollection));
        if (latestCollectionName.localeCompare(currentCollection) <= 0) {
          latestCollectionName = currentCollection;
          const content = JSON.stringify(change.fullDocument.content);
          const timestamp = JSON.stringify(change.fullDocument.timestamp);
          const role = JSON.stringify(change.fullDocument.role);
          if (io) {
            console.log(timestamp, role, content);
            io.emit('newDocument', timestamp, content, role);
          }
        } else {
          console.log("Old collection", change);
        }
      } else {
        console.log("Change event does not have a fullDocument or is not an insert operation:", change);
      }
    });
  } catch (e) {
    console.log("Has exception", e)
    if (dbChangeStream != null) {
      console.log("dbChangeStream is close")
      dbChangeStream.close();
    }

    await sleep(5000)
    // Re init change stream
    await setupChangeStream();
  }
}