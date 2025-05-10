import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";
import { SocialButton } from "@/components/ui/social-button";
import { signInWithGoogle, signInWithApple, getAuthRedirectResult, AuthResult } from "@/lib/firebase";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

// Extend schemas with client-side validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Check for redirect result on page load
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getAuthRedirectResult();
        if (result.success && result.user) {
          // Firebase user is authenticated, now we need to integrate with our backend
          toast({
            title: "Authentication Successful",
            description: `Logged in with ${result.provider === 'google.com' ? 'Google' : 'Apple'} successfully.`,
          });
          // In a real app, we would send the Firebase token to our backend
          // and create/login the user in our database
        } else if (result.error) {
          toast({
            title: "Authentication Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error checking redirect result:", error);
      }
    };

    checkRedirectResult();
  }, []);

  // Handle social login (Google or Apple)
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    try {
      if (provider === 'google') {
        setIsGoogleLoading(true);
        const result = await signInWithGoogle();
        if (!result.success && result.error) {
          toast({
            title: "Google Authentication Failed",
            description: result.error,
            variant: "destructive",
          });
        }
        // No need to handle success case - redirect will happen
        setIsGoogleLoading(false);
      } else if (provider === 'apple') {
        setIsAppleLoading(true);
        const result = await signInWithApple();
        if (!result.success && result.error) {
          toast({
            title: "Apple Authentication Failed",
            description: result.error,
            variant: "destructive",
          });
        }
        // No need to handle success case - redirect will happen
        setIsAppleLoading(false);
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-gray-50">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center p-6 md:p-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <i className="ri-robot-fill text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold ml-3 text-gray-900">DoMyJob</h1>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Sign in to your account to continue
                  </p>
                </div>

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-2 text-sm text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SocialButton
                    icon={<i className="ri-google-fill mr-1 text-lg text-red-500"></i>}
                    provider="Google"
                    onClick={() => handleSocialLogin('google')}
                    isLoading={isGoogleLoading}
                  />
                  <SocialButton
                    icon={<i className="ri-apple-fill mr-1 text-lg"></i>}
                    provider="Apple"
                    onClick={() => handleSocialLogin('apple')}
                    isLoading={isAppleLoading}
                  />
                </div>

                <div className="text-center text-sm">
                  <span className="text-gray-500">Don't have an account?</span>{" "}
                  <button
                    className="text-primary-600 hover:underline"
                    onClick={() => setActiveTab("register")}
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="register">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Create an account</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Sign up to start using DoMyJob
                  </p>
                </div>

                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-2 text-sm text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SocialButton
                    icon={<i className="ri-google-fill mr-1 text-lg text-red-500"></i>}
                    provider="Google"
                    onClick={() => handleSocialLogin('google')}
                    isLoading={isGoogleLoading}
                  />
                  <SocialButton
                    icon={<i className="ri-apple-fill mr-1 text-lg"></i>}
                    provider="Apple"
                    onClick={() => handleSocialLogin('apple')}
                    isLoading={isAppleLoading}
                  />
                </div>

                <div className="text-center text-sm">
                  <span className="text-gray-500">Already have an account?</span>{" "}
                  <button
                    className="text-primary-600 hover:underline"
                    onClick={() => setActiveTab("login")}
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero/Features */}
      <div className="hidden md:flex flex-col bg-gradient-to-br from-primary-600 to-primary-800 text-white p-12 justify-center relative overflow-hidden">
        <div className="max-w-md z-10">
          <h2 className="text-3xl font-bold mb-6">Let AI Handle Your Work Tasks</h2>
          <p className="text-primary-100 mb-8">
            DoMyJob learns about your responsibilities and helps automate tasks like drafting emails, 
            understanding documentation, and suggesting solutions.
          </p>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-4 bg-primary-500 p-2 rounded-full">
                <i className="ri-robot-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI-Powered Assistant</h3>
                <p className="text-primary-100 text-sm">
                  Your personal AI assistant that learns and adapts to your work style
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-primary-500 p-2 rounded-full">
                <i className="ri-file-text-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Context Awareness</h3>
                <p className="text-primary-100 text-sm">
                  Upload documents and knowledge bases to provide context to the AI
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 bg-primary-500 p-2 rounded-full">
                <i className="ri-lightbulb-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Smart Recommendations</h3>
                <p className="text-primary-100 text-sm">
                  Get intelligent solutions and recommendations based on your work history
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract shapes for visual interest */}
        <div className="absolute right-0 bottom-0 opacity-10">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M39.5,-65.6C52.9,-56.3,66.8,-48.6,75.2,-36.5C83.6,-24.4,86.6,-8,83.9,7.4C81.2,22.9,72.8,37.4,61.8,49.5C50.8,61.5,37.2,71,22.1,77.2C7.1,83.3,-9.5,86.1,-23.7,81.5C-37.9,76.9,-49.7,64.9,-58.4,51.5C-67.1,38,-72.6,23.1,-75.8,7.2C-79,-8.7,-79.9,-25.6,-73,-38.8C-66.1,-52,-51.3,-61.5,-37,-69C-22.6,-76.4,-8.7,-81.9,2.5,-85.9C13.7,-89.9,27.4,-92.5,39.5,-88.7C51.6,-84.9,62.2,-74.7,39.5,-65.6Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
