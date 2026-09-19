const fs = require('fs')
const path = require('path')
const { readJson, writeJson } = require('./jsonFile')

const welcomeFile = path.join(__dirname, '../storage/database/welcome.json')
const leftFile = path.join(__dirname, '../storage/database/left.json')
const welcomeStatusFile = path.join(__dirname, '../storage/database/welcome-status.json')
const leftStatusFile = path.join(__dirname, '../storage/database/left-status.json')

const readJSON = (file) => readJson(file, {})
const writeJSON = writeJson

function setWelcome(groupId, message) {
  const data = readJSON(welcomeFile)
  data[groupId] = message
  writeJSON(welcomeFile, data)
}

function getWelcome(groupId) {
  const data = readJSON(welcomeFile)
  return data[groupId] || 'Hi @user, welcome to @group!'
}

function setWelcomeStatus(groupId, status) {
  const data = readJSON(welcomeStatusFile)
  data[groupId] = status
  writeJSON(welcomeStatusFile, data)
}

function getWelcomeStatus(groupId) {
  const data = readJSON(welcomeStatusFile)
  return data[groupId] ?? true
}

function setLeft(groupId, message) {
  const data = readJSON(leftFile)
  data[groupId] = message
  writeJSON(leftFile, data)
}

function getLeft(groupId) {
  const data = readJSON(leftFile)
  return data[groupId] || 'Goodbye @user, leaving @group'
}

function setLeftStatus(groupId, status) {
  const data = readJSON(leftStatusFile)
  data[groupId] = status
  writeJSON(leftStatusFile, data)
}

function getLeftStatus(groupId) {
  const data = readJSON(leftStatusFile)
  return data[groupId] ?? true
}

async function sendWelcomeOrLeft(sock, groupId, participant, groupSubject, message, imagePath) {
  let profilePic = null
  try {
    profilePic = await sock.profilePictureUrl(participant, 'image')
  } catch {
    profilePic = null
  }

  const caption = message.replace('@user', `@${participant.split('@')[0]}`).replace('@group', groupSubject)
  const mentions = [participant]

  if (fs.existsSync(imagePath)) {
    await sock.sendMessage(groupId, { image: fs.readFileSync(imagePath), caption, mentions })
  } else if (profilePic) {
    await sock.sendMessage(groupId, { image: { url: profilePic }, caption, mentions })
  } else {
    await sock.sendMessage(groupId, { text: caption, mentions })
  }
}

const welcomeImagePath = path.join(__dirname, '../storage/media/image/welcome.jpg')
const leftImagePath = path.join(__dirname, '../storage/media/image/left.jpg')

async function welcomeHandler(sock, update) {
  try {
    const metadata = await sock.groupMetadata(update.id)

    if (update.action === 'add' && getWelcomeStatus(update.id)) {
      for (const participant of update.participants) {
        await sendWelcomeOrLeft(sock, update.id, participant, metadata.subject, getWelcome(update.id), welcomeImagePath)
      }
    } else if (update.action === 'remove' && getLeftStatus(update.id)) {
      for (const participant of update.participants) {
        await sendWelcomeOrLeft(sock, update.id, participant, metadata.subject, getLeft(update.id), leftImagePath)
      }
    }
  } catch (err) {
    console.error('Welcome/Left handler error:', err)
  }
}

module.exports = {
  welcomeHandler,
  setWelcome,
  setLeft,
  getWelcome,
  getLeft,
  setWelcomeStatus,
  setLeftStatus,
  getWelcomeStatus,
  getLeftStatus,
}
