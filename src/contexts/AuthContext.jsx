import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Web3 from 'web3';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = {
    withEmail: async (email, password) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Signed in successfully!');
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },

    withGoogle: async () => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
        if (error) throw error;
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },

    withPhone: async (phone) => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone,
        });
        if (error) throw error;
        toast.success('OTP sent to your phone!');
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },

    withMetamask: async () => {
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }

        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        const message = 'Sign this message to prove you own this wallet';
        const signature = await web3.eth.personal.sign(message, accounts[0], '');

        const { error } = await supabase.auth.signInWithPassword({
          email: `${accounts[0]}@metamask.auth`,
          password: signature,
        });

        if (error) throw error;
        toast.success('Signed in with MetaMask!');
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
  };

  const signUp = async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Check your email for verification link!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('Password reset instructions sent!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const verifyOTP = async (phone, token) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      toast.success('Phone number verified!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      verifyOTP,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}