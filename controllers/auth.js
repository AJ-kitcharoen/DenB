//controllers/auth.js

const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const speakeasy = require('speakeasy');
const bcrypt=require('bcryptjs');


//@desc     Register user
//@route    POST /api/v1/auth/register
//@access   Public
exports.register=async (req, res,next) => {
    try{
        const {name,telephone, email, password,role} = req.body;

        //Generate password with salt
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        // Create user
        const user = await User.create({
            name,
            telephone,
            email,
            password: hashedPassword,
            role
        });

        // Create token
        // const token = user.getSignedJwtToken();
        // res.status(200).json({
        //     success: true,
        //     token
        // });
        // sendTokenResponse(user, 200, res);
        res.status(200).json({success:true});
        
    } catch (error) {
        res.status(400).json({
            success: false});
            console.log(error.stack);
        }
};

//@desc     Login user
//@route    POST /api/v1/auth/login
//@access   Public
exports.login=async (req, res,next) => {
    
    try{
        const {email, password,otp} = req.body;

    // Validate email & password
        if(!email || !password) {
            return res.status(400).json({success: false, message: 'Please provide an email and password'});
        }

    // Check for user
        const user = await User.findOne({email}).select('+password');

        if(!user) {
            return res.status(400).json({success: false, message: 'Invalid credentials'});
        }

    // Check if password matches
        const isMatch = await user.matchPassword(password);

        if(!isMatch) {
            return res.status(401).json({success: false, message: 'Invalid credentials'});
        }

        // If user has 2fa enabled
        if(user.twoFactorEnabled) {
            if(!otp) {
                const temp_secret=speakeasy.generateSecret({length:6});
                const token=speakeasy.totp({
                    secret:temp_secret.base32,
                    encoding:'base32'
                });
                
                user.twoFactorTempSecret=temp_secret.base32;
                user.twoFactorOTPExpires=Date.now()+5*60*1000; //5 minutes
                await user.save();

                // Send token to email
                await sendEmail({
                    email: user.email,
                    subject: 'Your OTP Code',
                    message: `Your OTP code is ${token}. It will expire in 5 minutes.`
                });
                
                return res.status(200).json({success: true, message: 'OTP sent to email'});
            }

            // Verify OTP
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorTempSecret,
                encoding: 'base32',
                token: otp,
                window: 1
            });

            if(!verified || Date.now() > user.twoFactorOTPExpires) {
                return res.status(401).json({success: false, message: 'Invalid or expired OTP'});
            }
        }

    // Create token
    // const token = user.getSignedJwtToken(); 
    // res.status(200).json({
    //     success: true,
    //     token
    // }); 
    sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(401).json({
            success: false});
            console.log(error.stack);
        }
};  

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        });
};


//@desc Get current logged in user
//@route GET /api/v1/auth/me
//@access Private
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
};

//@desc Log user out / clear cookie
//@route GET/api/v1/auth/logout
//@access Private
exports.logout = async(req,res,next) =>
    {
        res.cookie('token','none',
            {
                expires: new Date(Date.now() + 10*1000),
                httpOnly: true
            }
        );

        res.status(200).json(
            {
                success: true,
                data: {}
            }
        );
    };