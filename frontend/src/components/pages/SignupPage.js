import {React , useState} from 'react';
import { Container, Grid, TextField, Button, Typography, Link } from '@mui/material';

function SiginUpPage({onLoginClick}){
    return (
        <Container maxWidth={false} disableGutters className="container">
      <Grid container spacing={0} className="grid-container">
        <Grid item xs={12} md={6} className="right-container">
          <div className="form-container">
          <TextField label="Name" variant="outlined" margin="normal" fullWidth />
          <TextField label="Email" variant="outlined" margin="normal" fullWidth />
             <TextField label="Password" type="password" variant="outlined" margin="normal" fullWidth />
             <Button variant="outlined"  className="admin-link" onClick={onLoginClick}>
               Login?
             </Button>
             <Typography variant="body2" color="textSecondary" className="welcome-text">
               If you halready have account.
             </Typography>
             <Button variant="outlined" color="primary" fullWidth className="signup-button" sx={{marginTop:5}}>
                  Signup
                </Button>
          </div>
        </Grid>

        <Grid item xs={12} md={6} className="left-container">
          <Typography variant="h4" gutterBottom className="title">
            Decentralized Attendance System
          </Typography>
        </Grid>
      </Grid>
    </Container>
    );
}

  
export default SiginUpPage;