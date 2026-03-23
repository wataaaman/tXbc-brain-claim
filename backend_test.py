import requests
import sys
import json
from datetime import datetime

class WCBBackendTester:
    def __init__(self, base_url="https://life-show-portal.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = self.session.headers.copy()
        if headers:
            test_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.content and 'application/json' in response.headers.get('content-type', '') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_register(self, name, email, password):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data={"name": name, "email": email, "password": password}
        )
        
        if success and isinstance(response, dict):
            if 'token' in response:
                self.token = response['token']
                self.session.headers['Authorization'] = f'Bearer {self.token}'
            if 'user' in response and 'user_id' in response['user']:
                self.user_id = response['user']['user_id']
            
        return success

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and isinstance(response, dict):
            if 'token' in response:
                self.token = response['token']
                self.session.headers['Authorization'] = f'Bearer {self.token}'
            if 'user' in response and 'user_id' in response['user']:
                self.user_id = response['user']['user_id']
                
        return success

    def test_get_me(self):
        """Test getting current user info"""
        if not self.token:
            print("❌ No token available for auth test")
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET", 
            "api/auth/me",
            200
        )
        return success

    def test_policies(self):
        """Test policy endpoints"""
        success1, response1 = self.run_test(
            "Get All Policies",
            "GET",
            "api/policies",
            200
        )
        
        success2 = True
        if success1 and isinstance(response1, list) and len(response1) > 0:
            first_policy_id = response1[0].get('policy_id')
            if first_policy_id:
                success2, response2 = self.run_test(
                    "Get Specific Policy",
                    "GET",
                    f"api/policies/{first_policy_id}",
                    200
                )
        
        return success1 and success2

    def test_create_claim(self):
        """Test creating a new claim"""
        if not self.token:
            print("❌ No token available for claim test")
            return False, None
            
        claim_data = {
            "claim_number": f"WCB-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "injury_type": "TBI",
            "injury_group": "Group 1",
            "injury_date": "2024-01-15",
            "description": "Test TBI claim for automated testing",
            "status": "active"
        }
        
        success, response = self.run_test(
            "Create Claim",
            "POST",
            "api/claims",
            200,
            data=claim_data
        )
        
        claim_id = None
        if success and isinstance(response, dict) and 'claim_id' in response:
            claim_id = response['claim_id']
            
        return success, claim_id

    def test_get_claims(self):
        """Test getting user's claims"""
        if not self.token:
            print("❌ No token available for claims test")
            return False
            
        success, response = self.run_test(
            "Get Claims",
            "GET",
            "api/claims", 
            200
        )
        return success

    def test_letter_generation(self, claim_id=None):
        """Test letter generation"""
        if not self.token:
            print("❌ No token available for letter test")
            return False
            
        letter_data = {
            "template_type": "claim_file_request",
            "claim_id": claim_id,
            "custom_data": {}
        }
        
        success, response = self.run_test(
            "Generate Letter",
            "POST",
            "api/letters/generate",
            200,
            data=letter_data
        )
        return success

    def test_ai_chat(self):
        """Test AI chat functionality"""
        if not self.token:
            print("❌ No token available for AI chat test")
            return False
            
        chat_data = {
            "messages": [{"role": "user", "content": "What is a Group 1 TBI?"}],
            "session_id": None
        }
        
        success, response = self.run_test(
            "AI Chat",
            "POST", 
            "api/chat",
            200,
            data=chat_data
        )
        return success

    def test_otp_flow(self):
        """Test OTP email flow (mocked)"""
        test_email = f"test{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        
        success1, response1 = self.run_test(
            "Send OTP",
            "POST",
            f"api/auth/otp/send?email={test_email}",
            200,
            data={}
        )
        
        # Note: In real implementation, we'd need the actual OTP from server logs
        # For testing purposes, we'll just test the send endpoint
        return success1

    def test_settings(self):
        """Test user settings"""
        if not self.token:
            print("❌ No token available for settings test")
            return False
            
        success1, response1 = self.run_test(
            "Get Settings",
            "GET",
            "api/settings",
            200
        )
        
        success2 = True
        if success1:
            # Test updating settings using form data
            import requests
            url = f"{self.base_url}/api/settings"
            form_data = {
                'theme': 'dark',
                'accent_color': 'green'
            }
            headers = {'Authorization': f'Bearer {self.token}'}
            
            try:
                response = requests.put(url, data=form_data, headers=headers)
                success2 = response.status_code == 200
                print(f"\n🔍 Testing Update Settings...")
                if success2:
                    print(f"✅ Passed - Status: {response.status_code}")
                else:
                    print(f"❌ Failed - Status: {response.status_code}")
            except Exception as e:
                print(f"❌ Failed - Error: {str(e)}")
                success2 = False
        
        return success1 and success2

    def test_comprehensive_timeline(self, claim_id):
        """Test comprehensive timeline endpoint"""
        if not self.token or not claim_id:
            print("❌ No token or claim_id available for timeline test")
            return False
            
        success, response = self.run_test(
            "Get Comprehensive Timeline",
            "GET",
            f"api/claims/{claim_id}/full-timeline",
            200
        )
        
        # Validate response structure
        if success and isinstance(response, dict):
            required_keys = ['claim', 'timeline', 'stats']
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                print(f"⚠️ Missing timeline response keys: {missing_keys}")
                return False
            print(f"✅ Timeline response has {len(response.get('timeline', []))} events")
            
        return success

    def test_pdf_generation(self, claim_id=None):
        """Test PDF generation endpoint"""
        if not self.token:
            print("❌ No token available for PDF test")
            return False
            
        # First create a letter to generate PDF from
        letter_data = {
            "template_type": "claim_file_request",
            "claim_id": claim_id,  # Use the provided claim_id
            "custom_data": {}
        }
        
        success, response = self.run_test(
            "Generate Letter for PDF",
            "POST",
            "api/letters/generate",
            200,
            data=letter_data
        )
        
        if not success or not isinstance(response, dict) or 'letter_id' not in response:
            print("❌ Failed to create letter for PDF test")
            return False
            
        letter_id = response['letter_id']
        
        # Now test PDF generation
        url = f"{self.base_url}/api/letters/{letter_id}/pdf"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        print(f"\n🔍 Testing PDF Generation...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, headers=headers)
            success = response.status_code == 200
            
            if success:
                # Check if response is PDF
                content_type = response.headers.get('content-type', '')
                if 'application/pdf' in content_type:
                    print(f"✅ Passed - PDF generated successfully (Size: {len(response.content)} bytes)")
                    self.tests_passed += 1
                else:
                    print(f"❌ Failed - Wrong content type: {content_type}")
                    success = False
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Response: {response.text[:200]}...")
            
            self.tests_run += 1
            return success
            
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.tests_run += 1
            return False

    def test_pinata_ipfs_upload(self, claim_id):
        """Test Pinata IPFS evidence upload"""
        if not self.token or not claim_id:
            print("❌ No token or claim_id available for IPFS test")
            return False
            
        # Create a small test file
        import io
        test_file_content = b"Test evidence file content for IPFS upload"
        
        url = f"{self.base_url}/api/evidence/upload"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        files = {
            'file': ('test_evidence.txt', io.BytesIO(test_file_content), 'text/plain')
        }
        
        data = {
            'claim_id': claim_id,
            'description': 'Test evidence upload for IPFS',
            'evidence_type': 'document'
        }
        
        print(f"\n🔍 Testing Pinata IPFS Upload...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, headers=headers, files=files, data=data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                if 'ipfs_cid' in result:
                    ipfs_cid = result['ipfs_cid']
                    is_mocked = result.get('is_mocked', False)
                    status = "MOCKED" if is_mocked else "REAL IPFS"
                    print(f"✅ Passed - {status} upload successful (CID: {ipfs_cid[:20]}...)")
                    self.tests_passed += 1
                else:
                    print(f"❌ Failed - No IPFS CID in response")
                    success = False
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Response: {response.text[:200]}...")
            
            self.tests_run += 1
            return success
            
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.tests_run += 1
            return False

    def test_ai_draft_letter(self, claim_id=None):
        """Test AI letter drafting endpoint"""
        if not self.token:
            print("❌ No token available for AI draft test")
            return False
            
        url = f"{self.base_url}/api/letters/ai-draft"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        form_data = {
            'purpose': 'I need to request my complete claim file because I believe there are missing medical records from my recent specialist visits.',
            'additional_context': 'I have been waiting for 3 weeks without response to my previous inquiry.'
        }
        
        if claim_id:
            form_data['claim_id'] = claim_id
        
        print(f"\n🔍 Testing AI Draft Letter...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, headers=headers, data=form_data)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                if 'content' in result and len(result['content']) > 100:
                    print(f"✅ Passed - AI letter generated ({len(result['content'])} characters)")
                    self.tests_passed += 1
                else:
                    print(f"❌ Failed - Invalid AI response content")
                    success = False
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error}")
                except:
                    print(f"   Response: {response.text[:200]}...")
            
            self.tests_run += 1
            return success
            
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.tests_run += 1
            return False

    def test_wallet_auth_message(self):
        """Test wallet authentication message endpoint"""
        test_address = "0x742f35Cc6Cd4C442C3d5f7a8Cc5D7E3b5a0E5b2F"
        
        success, response = self.run_test(
            "Wallet Auth Message",
            "GET",
            f"api/auth/wallet/message?address={test_address}",
            200
        )
        
        if success and isinstance(response, dict):
            required_keys = ['message', 'nonce']
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                print(f"⚠️ Missing wallet message response keys: {missing_keys}")
                return False
            print(f"✅ Wallet message contains: message and nonce")
            
        return success

    def test_wallet_auth_verify_endpoint(self):
        """Test wallet verification endpoint exists (without valid signature)"""
        # This will fail with invalid signature but confirms endpoint exists
        test_data = {
            "address": "0x742f35Cc6Cd4C442C3d5f7a8Cc5D7E3b5a0E5b2F",
            "message": "Test message",
            "signature": "0xinvalidsignature",
            "nonce": "test_nonce"
        }
        
        success, response = self.run_test(
            "Wallet Verify Endpoint (Expected 401)",
            "POST",
            "api/auth/wallet/verify",
            401,  # Expecting failure due to invalid signature
            data=test_data
        )
        
        return success

    def test_email_otp_endpoints(self):
        """Test email OTP endpoints"""
        test_email = f"otp_test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        
        # Test send OTP
        success1, response1 = self.run_test(
            "Send Email OTP",
            "POST",
            f"api/auth/otp/send?email={test_email}",
            200
        )
        
        if not success1:
            return False
            
        # Test verify OTP (will fail with wrong code but confirms endpoint exists)
        verify_data = {
            "email": test_email,
            "otp_code": "123456"  # Wrong code on purpose
        }
        
        success2, response2 = self.run_test(
            "Verify Email OTP (Expected 400)",
            "POST", 
            "api/auth/otp/verify",
            400,  # Expecting failure due to wrong OTP
            data=verify_data
        )
        
        return success1 and success2

def main():
    # Setup
    tester = WCBBackendTester()
    timestamp = datetime.now().strftime('%H%M%S')
    test_email = f"test_user_{timestamp}@example.com"
    test_password = "TestPass123!"
    test_name = f"Test User {timestamp}"

    print("🚀 Starting WCB Backend API Tests")
    print(f"Base URL: {tester.base_url}")
    print("=" * 60)

    # Health check first
    if not tester.test_health_check():
        print("❌ Health check failed, stopping tests")
        return 1

    # Test user registration
    if not tester.test_register(test_name, test_email, test_password):
        print("❌ Registration failed, stopping tests")
        return 1

    # Test auth endpoints
    if not tester.test_get_me():
        print("⚠️ Get me endpoint failed")

    # Test policies (public endpoint)
    if not tester.test_policies():
        print("⚠️ Policies endpoint failed")

    # Test claims
    claim_success, claim_id = tester.test_create_claim()
    if not claim_success:
        print("⚠️ Create claim failed")
    
    if not tester.test_get_claims():
        print("⚠️ Get claims failed")

    # Test letter generation
    if not tester.test_letter_generation(claim_id):
        print("⚠️ Letter generation failed")

    # Test AI chat
    if not tester.test_ai_chat():
        print("⚠️ AI chat failed")

    # Test OTP flow  
    if not tester.test_otp_flow():
        print("⚠️ OTP flow failed")

    # Test settings
    if not tester.test_settings():
        print("⚠️ Settings failed")

    # === NEW FEATURES TESTING ===
    print("\n🚀 Testing New Features:")
    
    # Test comprehensive timeline (requires claim_id)
    if claim_id:
        if not tester.test_comprehensive_timeline(claim_id):
            print("⚠️ Comprehensive timeline failed")
    
    # Test PDF generation
    if not tester.test_pdf_generation(claim_id):
        print("⚠️ PDF generation failed")
    
    # Test Pinata IPFS upload (may fail with invalid key but should attempt)
    if claim_id:
        if not tester.test_pinata_ipfs_upload(claim_id):
            print("⚠️ Pinata IPFS upload failed (expected if API key is invalid)")
    
    # Test AI draft letter
    if not tester.test_ai_draft_letter(claim_id):
        print("⚠️ AI draft letter failed")

    # === NEW FRICTIONLESS AUTH TESTING ===
    print("\n🔐 Testing New Frictionless Authentication Features:")
    
    # Test wallet authentication endpoints
    if not tester.test_wallet_auth_message():
        print("⚠️ Wallet auth message endpoint failed")
    
    if not tester.test_wallet_auth_verify_endpoint():
        print("⚠️ Wallet verify endpoint failed")
    
    # Test email OTP endpoints
    if not tester.test_email_otp_endpoints():
        print("⚠️ Email OTP endpoints failed")

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 70:
        print("✅ Backend is mostly functional")
        return 0
    else:
        print("❌ Backend has significant issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())