import User from '../models/User.js'

export async function login(req, res) {
  try {
    const username = String(req.body.username || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Enter username and password' })
    }

    const user = await User.findOne({ username })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' })
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
