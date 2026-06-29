import { GoogleLogin } from '@react-oauth/google';
import { SocialButton } from '../ui/SocialButton';
import { GoogleIcon, GithubIcon, MicrosoftIcon } from '../icons';
import { useAuth } from '../../contexts/AuthContext';

interface OAuthButtonsProps {
    mode: 'login' | 'register';
}

export function OAuthButtons({ mode }: OAuthButtonsProps) {
    const { loginWithGoogleToken, loginWithGithub, loginWithMicrosoft } = useAuth();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            await loginWithGoogleToken(credentialResponse.credential!);
        } catch (error) {
            console.error('Google OAuth failed:', error);
        }
    };

    const buttonText = mode === 'login' ? 'signin_with' : 'signup_with';

    return (
        <div className="space-y-3">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log('OAuth Failed')}
                theme="filled_black"
                size="large"
                text={buttonText}
                shape="rectangular"
                width="400"
            />

            <SocialButton
                icon={<GithubIcon />}
                onClick={loginWithGithub}
            >
                GitHub
            </SocialButton>

            <SocialButton
                icon={<MicrosoftIcon />}
                onClick={loginWithMicrosoft}
                disabled
            >
                Microsoft (Coming Soon)
            </SocialButton>
        </div>
    );
}

export default OAuthButtons;
