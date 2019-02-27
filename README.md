# Auger Telescope

## Installation

> You might need to run the script as root, in order to have access to your USB ports!

### Dependencies

- [NodeJS](https://nodejs.org/en/) ^7.6

- npm (short for **N**ode **P**ackage **M**anager, ships with NodeJS) or alternatively [yarn](https://yarnpkg.com/lang/en/).

### Step 1

```bash
git clone https://github.com/loislnessie/augertelescope.git && cd augertelescope
```

### Step 2

Customize `.env` file to your needs AND set the constants in `client/index.js`. Replace `{your_api_route}` with the URL of your REST server and `{your_api_key}` with the specific API key.

### Step 3

Type `yarn` (or `npm install`, depending on your package manager) to install the project's dependencies.

### Step 4

Plug in the DAQ-Card and run the synchronization script found in `./sync/index.js` by typing `node sync/index.js`. You can specify 

### Step 5

Add the line

```bash
node <path_to_the_repo>/client/index.js &
```

to your `/etc/rc.local` file.

### Step 6

Reboot your computer. Hopefully, it will start collecting data and sending it in bundles of 5000 events to the server.
