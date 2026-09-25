import Link from 'next/link';

export default function SignInContainer() {
  return (
    <div className="sign-in-container">
      <h3>Discover & read more</h3>
      <Link href="/api/auth/signin/github?callbackUrl=/" className="github-button">
        Continue with GitHub
      </Link>
      <Link href="/api/auth/signin/google?callbackUrl=/" className="google-button">
        Continue with Google
      </Link>
      <Link href="/signup" className="email-button">
        Sign up with email
      </Link>
      <p>
        By creating an account, you agree to the ReadHaven{' '}
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </p>
      <p>
        Already a member? <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}
