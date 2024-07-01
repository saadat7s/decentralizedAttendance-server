# Decentralized Attendance System

## Project Overview
The Decentralized Attendance System is a blockchain-based solution designed to provide a transparent, secure, and tamper-proof method for recording and managing attendance records. Utilizing the Solana blockchain, this system aims to revolutionize traditional attendance tracking methods by ensuring data integrity and security while offering real-time updates and accessibility.

## Goals
- **Decentralization**: Implement a decentralized approach to track attendance, reducing the risk of data tampering and increasing transparency.
- **Security**: Utilize blockchain technology to ensure the security and immutability of attendance records.
- **Smart Contracts**: Develop and deploy smart contracts on the Solana blockchain to automate the attendance tracking process.
- **User-friendly Interface**: Provide an intuitive interface for managing attendance, accessible to both administrators and users.
- **Real-time Updates**: Ensure that attendance records are updated in real-time, allowing for immediate access and verification.

## Features
- **Blockchain Integration**: Use Solana blockchain for secure and immutable record-keeping.
- **Smart Contracts**: Automate attendance tracking with smart contracts, ensuring that all records are accurate and tamper-proof.
- **User Authentication**: Implement secure user authentication to ensure that only authorized users can access and modify attendance records.
- **Role-based Access Control**: Differentiate access levels for administrators and regular users.
- **Responsive Design**: Ensure the user interface is accessible on various devices, including desktops, tablets, and smartphones.

## Technologies Used
- **Solana**: Blockchain platform for decentralized applications.
- **Rust**: Programming language for writing Solana smart contracts.
- **React**: Frontend framework for building the user interface.
- **Node.js**: Backend server for handling API requests.
- **MongoDB**: Database for storing user information and additional data.
- **Express**: Web framework for building the backend server.
- **Redux**: State management for React applications.

## Smart Contracts

Smart contracts for this project are developed using Solana Playground. Follow these steps to manage the smart contracts:

1. **Access Solana Playground:**
   - Go to [Solana Playground](https://beta.solpg.io/).

2. **Develop Smart Contracts:**
   - Use the online editor to write, compile, and deploy your smart contracts.

3. **Integrate with Backend:**
   - Document the addresses and APIs of deployed contracts.
   - Update the backend configuration to interact with the deployed contracts on the Solana blockchain.

Refer to the Solana Playground documentation for more details on smart contract development.

## Installation and Setup
1. **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/decentralized-attendance-system.git
    cd decentralized-attendance-system
    ```

2. **Install dependencies for backend and frontend:**
    ```bash
    cd backend
    npm install
    cd ../frontend
    npm install
    ```

3. **Configure environment variables:**
    - Create a `.env` file in the `backend` directory and add necessary configurations.


    ```

4. **Run the development servers:**
    ```bash
    cd backend
    npm start
    cd ../frontend
    npm start
    ```

## Usage
1. **Register as a new user or log in with existing credentials.**
2. **Access the dashboard to view and manage attendance records.**
3. **Admins can add or remove users and manage their roles.**
4. **Users can check their attendance records and submit requests.**

## Contributing
We welcome contributions from the community. To contribute:
1. **Fork the repository.**
2. **Create a new branch (`git checkout -b feature-branch`).**
3. **Make your changes and commit them (`git commit -m 'Add some feature'`).**
4. **Push to the branch (`git push origin feature-branch`).**
5. **Create a pull request.**

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
