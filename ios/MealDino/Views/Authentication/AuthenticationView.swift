import SwiftUI

struct AuthenticationView: View {
    @EnvironmentObject var authService: AuthenticationService
    @State private var email = ""
    @State private var isLoading = false

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(spacing: 32) {
                    Spacer(minLength: geometry.size.height * 0.1)

                    // App Logo and Title
                    appHeader

                    // Authentication Options
                    authenticationOptions

                    // Error Message
                    if let errorMessage = authService.authError {
                        errorView(errorMessage)
                    }

                    Spacer(minLength: 32)

                    // Terms and Privacy
                    termsAndPrivacy
                }
                .frame(minHeight: geometry.size.height)
                .padding(.horizontal, 32)
            }
        }
        .background(
            LinearGradient(
                colors: [Color.green.opacity(0.1), Color.blue.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .ignoresSafeArea()
    }

    private var appHeader: some View {
        VStack(spacing: 16) {
            // App Icon
            Image(systemName: "leaf.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)

            VStack(spacing: 8) {
                Text("MealDino")
                    .font(.title)
                    .fontWeight(.bold)

                Text("Healthy Recipes Made Simple")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    private var authenticationOptions: some View {
        VStack(spacing: 20) {
            // Google Sign In
            Button(action: {
                isLoading = true
                authService.signInWithGoogle()
            }) {
                HStack(spacing: 12) {
                    Image(systemName: "globe")
                        .font(.title2)

                    Text("Continue with Google")
                        .font(.headline)
                        .fontWeight(.medium)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color.blue)
                .cornerRadius(12)
            }
            .disabled(isLoading)

            // Divider
            HStack {
                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(.secondary.opacity(0.3))

                Text("or")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 16)

                Rectangle()
                    .frame(height: 1)
                    .foregroundColor(.secondary.opacity(0.3))
            }

            // Email Authentication
            VStack(spacing: 16) {
                // Email Input
                VStack(alignment: .leading, spacing: 8) {
                    Text("Email Address")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    TextField("Enter your email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(CustomTextFieldStyle())
                }

                // Email Sign In Button
                Button(action: {
                    isLoading = true
                    authService.signInWithEmail(email)
                }) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "envelope.fill")
                                .font(.title2)
                        }

                        Text(isLoading ? "Sending..." : "Send Magic Link")
                            .font(.headline)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(email.isValidEmail ? Color.green : Color.gray)
                    .cornerRadius(12)
                }
                .disabled(!email.isValidEmail || isLoading)

                Text("We'll send you a secure link to sign in")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    private func errorView(_ message: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.red)
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(8)
    }

    private var termsAndPrivacy: some View {
        VStack(spacing: 8) {
            Text("By continuing, you agree to our")
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(spacing: 4) {
                Button("Terms of Service") {
                    // TODO: Open terms of service
                }
                .font(.caption)
                .foregroundColor(.blue)

                Text("and")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Button("Privacy Policy") {
                    // TODO: Open privacy policy
                }
                .font(.caption)
                .foregroundColor(.blue)
            }
        }
    }
}

struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}

extension String {
    var isValidEmail: Bool {
        let emailRegEx = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPred = NSPredicate(format: "SELF MATCHES %@", emailRegEx)
        return emailPred.evaluate(with: self) && !isEmpty
    }
}

#Preview {
    AuthenticationView()
        .environmentObject(AuthenticationService())
}