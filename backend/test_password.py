import sys

test_password = "Test1234"
print(f"Password: '{test_password}'")
print(f"Length in characters: {len(test_password)}")
print(f"Length in UTF-8 bytes: {len(test_password.encode('utf-8'))}")
print(f"Bytes: {test_password.encode('utf-8')}")
print(f"Repr: {repr(test_password)}")
