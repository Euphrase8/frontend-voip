import React, { useState } from "react";
import Logo from "../assets/Login.png";
import { register } from "../services/register";

const RegisterPage = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateStep = () => {
    switch (step) {
      case 0:
        return username.trim().length >= 3;
      case 1:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case 2:
        return role === "user" || role === "admin";
      case 3:
        return password.length >= 6;
      case 4:
        return confirmPassword === password;
      default:
        return false;
    }
  };

  const nextStep = async () => {
    if (!validateStep()) {
      setError("Please fill in valid information.");
      return;
    }

    setError("");

    if (step < 4) {
      setStep(step + 1);
    } else {
      // Final step: call API
      try {
        const res = await register(username, email, password, role);
        setSuccess(res.message || "Registration successful!");
        setTimeout(() => {
          onSwitchToLogin();
        }, 1500);
      } catch (err) {
        setError(
          err.response?.data?.message || "Registration failed. Try again."
        );
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md transition-all duration-500 overflow-hidden">
        {/* Static Header */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={Logo}
            alt="Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-contain mb-2"
          />
          <h3 className="text-center text-sm font-bold">
            THE INSTITUTE OF FINANCE MANAGEMENT
          </h3>
          <h2 className="text-xl sm:text-2xl font-extrabold text-center text-gray-900 mt-1">
            VoIP Register
          </h2>
        </div>

        {/* Form Inputs */}
        <form className="space-y-4">
          {[
            {
              label: "Username",
              value: username,
              onChange: setUsername,
              type: "text",
              placeholder: "Enter username",
            },
            {
              label: "Email",
              value: email,
              onChange: setEmail,
              type: "email",
              placeholder: "Enter email",
            },
            {
              label: "Role",
              value: role,
              onChange: setRole,
              type: "select",
              options: ["user", "admin"],
            },
            {
              label: "Password",
              value: password,
              onChange: setPassword,
              type: "password",
              placeholder: "Enter password",
            },
            {
              label: "Confirm Password",
              value: confirmPassword,
              onChange: setConfirmPassword,
              type: "password",
              placeholder: "Re-enter password",
            },
          ].map((field, index) => (
            <div
              key={index}
              className={`overflow-hidden transition-all duration-500 ${
                step === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <label className="block text-sm font-medium">{field.label}</label>
              {field.type === "select" ? (
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                  autoFocus={step === index}
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  onKeyDown={handleKeyDown}
                  autoFocus={step === index}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              )}
            </div>
          ))}

          {/* Messages */}
          {error && (
            <p className="text-red-600 text-center text-sm animate-pulse">{error}</p>
          )}
          {success && (
            <p className="text-green-600 text-center text-sm animate-pulse">
              {success}
            </p>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={nextStep}
            className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 font-semibold focus:ring-2 focus:ring-blue-400"
          >
            {step < 4 ? "Next" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-500 hover:text-blue-700 font-medium focus:outline-none focus:underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
