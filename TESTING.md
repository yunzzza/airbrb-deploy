Three component tests are written for verifying key UI components behave correctly under different states  

1.App Routing Tests (File: App.test.jsx)  
1.1 The Navbar appears on the home page (/)
1.2 The Login page renders when visiting /login  
aim to confirm App correctly switches pages based on URL


2.LoginPage Tests (LoginPage.test.jsx)
2.1 Error message appears when fields are empty  
2.2 Successful login calls login() with correct args  
2.3 Successful login will call useNavigate('/')  
aim to confirm login function works correctly

3.Navbar Tests (Navbar.test.jsx)  
3.1 Logged-out state shows "Login" and "Sign up" buttons in Navbar
3.2 Logged-in state shows user email and "Logout" button in Navbar
3.3 Logout button correctly calls logout()  
aim to confirm Navbar correctly shows  based on different auth's status