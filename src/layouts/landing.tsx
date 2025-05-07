import React, { useState } from "react";
import getPasskeyCredential from "utils/passkey/authenticate/getPasskeyCredential";
import parseClientData from "utils/passkey/shared/parseClientData";
import UserAccount from "types/passkey/userAccount";
import verifyUserId from "utils/passkey/authenticate/verifyUserId";
import verifyClientData from "utils/passkey/authenticate/verifyClientData";
import store, { RootState } from "redux-functionality/index";
import { useSelector } from "react-redux";

interface Props {
  onRegister: () => void;
  onSignIn: () => void;
}

const Landing = ({ onRegister, onSignIn }: Props) => {
  const [username, setUsername] = useState<string>("");

  const userAccounts: Array<UserAccount> = useSelector(
    (state: RootState) => state.userAccounts.accounts
  );

  const onUserNameChanged = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(ev.target.value);
  };

  const getUserAccount = () => {
    if (userAccounts === undefined) {
      return null;
    }

    const match = userAccounts.filter(
      (item) => item.username.toLowerCase() === username.toLowerCase()
    );

    if (match.length > 0) {
      return match[0];
    } else {
      return null;
    }
  };

  const performLogin = async (challenge: string) => {
    console.log("⚈ ⚈ ⚈ performLogin ⚈ ⚈ ⚈");
    try {
      const credential = await getPasskeyCredential(challenge);
      console.log(" performLogin ✅ credential : ", credential);
      return credential;
    } catch (error) {
      console.log(
        "performLogin ❌  Failed to get credential with error : ",
        error
      );
      return null;
    }
  };

  const signIn = async () => {
    console.log("⚈ ⚈ ⚈ signIn ⚈ ⚈ ⚈");
    const userAccount = getUserAccount();
    console.log("⚈ ⚈ ⚈ getUserAccount ⚈ ⚈ ⚈");
    if (userAccount !== null) {
      console.log(
        "Get User Account ✅ There is a match for that username : ",
        userAccount
      );
      const credential = await performLogin(userAccount.challengeBuffer);

      if (credential !== null) {
        switch (verifyUserId(credential, userAccount.userId)) {
          case true:
            switch (verifyClientData(credential, userAccount)) {
              case true:
                console.log("✅ You have succesfully logged in.");
                onSignIn();
                break;
              case false:
                console.log("❌ The challenge does not match.");
                break;
            }
            break;
          case false:
            break;
        }
      } else {
        console.log(
          " signIn ❌ Failed to perform Login as credential does not exist."
        );
      }
    } else {
      console.log(" signIn ❌ There is no match for that username.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="absolute top-0 left-0 w-full">
        <div className="bg-blue-600 h-2 w-full"></div>
      </div>
      
      <div className="max-w-md w-full relative">
        <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-blue-600 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-black mb-2 text-center">
            TN-KUN
          </h1>
          <p className="text-center text-gray-600 mb-6">
          Secure your access — because your identity matters
          </p>
          
          <div className="mb-5">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="username"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                placeholder="you@example.com"
                type="email"
                autoComplete="username webauthn"
                value={username}
                onChange={onUserNameChanged}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <button
            onClick={signIn}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors mb-5 font-medium flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <button
            onClick={onRegister}
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors font-medium flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create Account
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-6">
            Secure login powered by passkeys
          </p>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-white text-sm">
            Need help? <a href="#" className="text-blue-400 hover:text-blue-300">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;