# Job Application Email Sender

A minimal Next.js application that sends job application emails from your Gmail account with CV attachment.

## 🚀 Features

- Simple web interface with email input and job type selection
- Two email templates (React Developer & React Native Developer)
- Automatic CV attachment
- Gmail App Password authentication
- Clean, minimal codebase

## 📋 Prerequisites

- Node.js 18+ installed
- Gmail account
- Gmail App Password (see setup instructions below)

## 🔐 Setup Gmail App Password

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable 2-Step Verification (if not already enabled)

### Step 2: Generate App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select app: **Mail**
5. Select device: **Other (Custom name)**
6. Enter name: **Next.js Email Sender** (or any name)
7. Click **Generate**
8. Copy the 16-character password (spaces don't matter)

**Important:** This 16-character password is your `EMAIL_PASS`. Save it securely!

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a file named `.env.local` in the root directory:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```
   
   Replace:
   - `your-email@gmail.com` with your Gmail address
   - `your-16-character-app-password` with the App Password you generated

3. **Add your CV file:**
   
   Place your CV file in the `public` folder with the exact name:
   ```
   public/Musharraf-CV.pdf
   ```

## 🏃 Run Locally

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Test the application:**
   - Enter a recruiter email address
   - Select job type (React Developer or React Native Developer)
   - Click "Send Application"
   - Check for success/error message

## 🚢 Deploy to Vercel

### Step 1: Push to GitHub

1. Initialize git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/email-sender.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **Add New Project**
3. Import your GitHub repository
4. **Add Environment Variables:**
   - Click **Environment Variables**
   - Add `EMAIL_USER` with your Gmail address
   - Add `EMAIL_PASS` with your Gmail App Password
5. Click **Deploy**

### Step 3: Upload CV File

After deployment, you have two options:

**Option A: Keep CV in repository (Recommended)**
- Just make sure `public/Musharraf-CV.pdf` is committed to git
- Vercel will automatically include it in deployment

**Option B: Use Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

## 📁 Project Structure

```
email-sender/
├── app/
│   ├── api/
│   │   └── send-email/
│   │       └── route.ts          # API route for sending emails
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main UI component
├── lib/
│   └── mailer.ts                 # Nodemailer configuration
├── public/
│   └── Musharraf-CV.pdf      # CV file (you need to add this)
├── .env.local                    # Environment variables (create this)
├── .env.local.example            # Example env file
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Troubleshooting

### "Email connection error"
- Verify your `EMAIL_USER` and `EMAIL_PASS` are correct
- Make sure you're using App Password, not regular password
- Check that 2-Step Verification is enabled

### "CV file not found"
- Ensure the file is named exactly: `Musharraf-CV.pdf`
- Make sure it's in the `public` folder
- Check file permissions

### "Failed to send email"
- Verify recipient email is valid
- Check Gmail account isn't locked
- Review server logs for detailed error messages

## 📝 Email Templates

The application includes two pre-configured templates:

1. **React Developer** - Includes React.js, Next.js, and web development skills
2. **React Native Developer** - Includes React Native, mobile development, and native tools

Both templates include your contact information and LinkedIn profile.

## 🛡️ Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- App Passwords are safer than regular passwords
- Keep your App Password secure
- Consider rotating App Passwords periodically

## 📄 License

This project is for personal use.

