import { Resend} from "resend";
import { redis } from './redis.js';
import  { db } from './database.js';

const OTP_HOLD_SECONDS = (process.env.TIME_HOLD_MINUTES || 5) * 60;
const resend = new Resend(process.env.RESEND_API_KEY);



export async function sendGenericEmail(fromAddress, toAddress, subject, htmlContent) {
    try {
        const { data, error } = await resend.emails.send({
            from: fromAddress, 
            to: toAddress, 
            subject: subject,
            html: htmlContent,
        });

        if (error) {
            console.error('Lỗi Resend API:', error);
            return { success: false, message: error.message };
        }

        console.log('Email đã gửi thành công. ID:', data.id);
        return { success: true, message: 'Email sent successfully.', emailId: data.id};

    } catch (err) {
        console.error('Lỗi hệ thống khi gửi email:', err);
        return { success: false, message: 'Internal server error while sending email.' };
    }
}



function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function saveOTPToRedis(userId, otpCode) {
    const key = `otp-verify-email:${userId}`;
    if (!userId || !otpCode) {
        return false;
    }
    // kiểm tra xem có tồn tại OTP chưa
    if (await redis.get(key)) {
        return false
            
    } else {
        await redis.set(key, otpCode, 'EX', OTP_HOLD_SECONDS);
    }
    return true;
}


export async function sendOTPEmail(req, res) {
    const { userId, recipientEmail } = req.body;
    const otpCode = generateOTP();
    const saveResult = await saveOTPToRedis(userId, otpCode);
    
    if (!saveResult) {
        return res.status(400).json({ success: false, message: 'Không thể tạo mã OTP mới vào lúc này. Vui lòng thử lại sau.' })
    }

    const emailSubject = `Mã xác thực OTP của bạn: ${otpCode}`;
    const emailHtmlContent = `
        <div style="font-family: Arial, sans-serif;">
            <p>Mã xác thực OTP của bạn là:</p>
            <h1 style="color: #007bff; text-align: center;">${otpCode}</h1>
            <p>Mã này sẽ hết hạn sau 5 phút.</p>
        </div>
    `;

    const fromAddress = "noreply@phuocsiucap.id.vn"; 
    const sendResult = await sendGenericEmail(fromAddress, recipientEmail, emailSubject, emailHtmlContent);

    if (!sendResult.success) {
        return res.status(500).json({ success: false, message: 'Lỗi khi gửi email OTP. Vui lòng thử lại sau.' });
    }
    return res.status(200).json({ success: true, message: 'Mã OTP đã được gửi đến email của bạn.', emailId: sendResult.emailId });
}


export async function verifyOTP(req, res) {
    const { userId, otpCode } = req.body;

    const key = `otp-verify-email:${userId}`;
    const storedOtp = await redis.get(key);
    if (!storedOtp || storedOtp.toString !== otpCode.toString) {
        return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }
    await redis.del(key);
    return res.status(200).json({ success: true, message: 'Xác thực OTP thành công.' });

}

export async function resetPasswordWithOTP(req, res) {
    const { userId, otpCode, newPassword } = req.body;

    if (!userId || !otpCode || !newPassword) {
        return res.status(400).json({ success: false, message: 'userId, otpCode và newPassword là bắt buộc.' });
    }

    // Verify OTP first
    const key = `otp-verify-email:${userId}`;
    const storedOtp = await redis.get(key);
    if (!storedOtp || storedOtp !== otpCode) {
        return res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    // Hash new password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const dbClient = await db.getClient();
    try {
        const updateQuery = "UPDATE users SET hashed_password = $1 WHERE id = $2";
        await dbClient.query(updateQuery, [hashedPassword, userId]);
        
        // Delete OTP after successful password reset
        await redis.del(key);
        
        return res.status(200).json({ success: true, message: 'Mật khẩu đã được cập nhật thành công.' });
    } catch (error) {
        console.error('Lỗi khi cập nhật mật khẩu:', error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống. Vui lòng thử lại sau.' });
    }
}

export async function forgotPassword(req, res) {
    const { recipientEmail } = req.body;
    const dbClient = await db.getClient();
    try {
        const checkUserQuery = "SELECT id FROM users WHERE email = $1";
        const result = await dbClient.query(checkUserQuery, [recipientEmail]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống.' });
        }
        const userId = result.rows[0].id;
        
        const otpCode = generateOTP();
        const saveResult = await saveOTPToRedis(userId, otpCode);
        if (!saveResult) {
            return res.status(400).json({ success: false, message: 'Không thể tạo mã OTP mới vào lúc này. Vui lòng thử lại sau.' })
        }
     
        const emailSubject = `Mã xác thực OTP của bạn: ${otpCode}`;
        const emailHtmlContent = `
            <div style="font-family: Arial, sans-serif;">
                <p>Mã xác thực OTP của bạn là:</p>
                <h1 style="color: #007bff; text-align: center;">${otpCode}</h1>
                <p>Mã này sẽ hết hạn sau 5 phút.</p>
            </div>
        `;
        const fromAddress = "noreply@phuocsiucap.id.vn"; 
        const sendResult = await sendGenericEmail(fromAddress, recipientEmail, emailSubject, emailHtmlContent);
        if (!sendResult.success) {
            return res.status(500).json({ success: false, message: 'Lỗi khi gửi email OTP. Vui lòng thử lại sau.' });
        }
        return res.status(200).json({ success: true, message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng nhập mã để đổi mật khẩu', emailId: sendResult.emailId, userId: userId });

    } catch (error) {
        console.error('Lỗi khi xử lý quên mật khẩu:', error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống. Vui lòng thử lại sau.' });
    }
}