from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

test_password = "Test1234"
print(f"Testing password: '{test_password}'")
print(f"Password length: {len(test_password)} chars, {len(test_password.encode('utf-8'))} bytes")

try:
    hashed = pwd_context.hash(test_password)
    print(f"\n✓ SUCCESS! Hash created:")
    print(f"  {hashed[:60]}...")
    
    # Verify
    verified = pwd_context.verify(test_password, hashed)
    print(f"\n✓ Verification: {verified}")
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    print(f"   Type: {type(e)}")
