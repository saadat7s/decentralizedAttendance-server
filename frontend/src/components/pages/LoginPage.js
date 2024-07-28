import {React , useState} from 'react';
import { Container, Grid, TextField, Button, Typography, Link } from '@mui/material';
import './SignupPage'
import SiginUpPage from './SignupPage';

function LoginPage() { 
    const [tab,setTab]  = useState("Login")
    return (
    tab=='Login'  ?     <Container maxWidth={false} disableGutters className="container">
      <Grid container spacing={0} className="grid-container">
        <Grid item xs={12} md={6} className="right-container">
          <div className="form-container">
          
          <TextField label="User ID" variant="outlined" margin="normal" fullWidth />
             <TextField label="Password" type="password" variant="outlined" margin="normal" fullWidth />
             <Link href="#" variant="body2" className="admin-link">
               Admin?
             </Link>
             <Typography variant="body2" color="textSecondary" className="welcome-text">
               If you are not user you are not welcome.
             </Typography>

            <Grid container spacing={2} className="button-container" sx={{marginTop:5}}>
              <Grid item xs={6}>
                <Button onClick={()=>{

                }} variant="contained" color="primary" fullWidth className="login-button">
                  Login
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button  onClick={()=>{
                      setTab('Signup')
                }} variant="outlined" color="primary" fullWidth className="signup-button">
                  Signup
                </Button>
              </Grid>
            </Grid>
          </div>
        </Grid>

        <Grid item xs={12} md={6} className="left-container">
          <Typography variant="h4" gutterBottom className="title">
            Decentralized Attendance System
          </Typography>
        </Grid>
      </Grid>
    </Container> : <SiginUpPage
    onLoginClick={()=>{
      setTab('Login')
    }}
    />
  );
  }
  
  export default LoginPage;