import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authService: AuthenticationService
    @State private var showingSignOutAlert = false

    var body: some View {
        NavigationView {
            List {
                // User Info Section
                userInfoSection

                // Settings Section
                settingsSection

                // Support Section
                supportSection

                // Sign Out Section
                signOutSection
            }
            .navigationTitle("Profile")
            .alert("Sign Out", isPresented: $showingSignOutAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Sign Out", role: .destructive) {
                    authService.signOut()
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }

    private var userInfoSection: some View {
        Section {
            HStack(spacing: 16) {
                // Profile Picture
                Circle()
                    .fill(Color.green.gradient)
                    .frame(width: 60, height: 60)
                    .overlay {
                        if let imageUrl = authService.user?.image, !imageUrl.isEmpty {
                            AsyncImage(url: URL(string: imageUrl)) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Text(authService.user?.initials ?? "U")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                            .clipShape(Circle())
                        } else {
                            Text(authService.user?.initials ?? "U")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                    }

                VStack(alignment: .leading, spacing: 4) {
                    Text(authService.user?.displayName ?? "User")
                        .font(.headline)
                        .fontWeight(.semibold)

                    if let email = authService.user?.email {
                        Text(email)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Text("Member since \(memberSinceText)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }
            .padding(.vertical, 8)
        }
    }

    private var settingsSection: some View {
        Section("Settings") {
            SettingsRow(
                title: "Notifications",
                icon: "bell.fill",
                iconColor: .orange
            ) {
                // TODO: Navigate to notification settings
            }

            SettingsRow(
                title: "Dietary Preferences",
                icon: "leaf.fill",
                iconColor: .green
            ) {
                // TODO: Navigate to dietary preferences
            }

            SettingsRow(
                title: "Units & Measurements",
                icon: "ruler.fill",
                iconColor: .blue
            ) {
                // TODO: Navigate to units settings
            }

            SettingsRow(
                title: "Privacy & Data",
                icon: "lock.fill",
                iconColor: .purple
            ) {
                // TODO: Navigate to privacy settings
            }
        }
    }

    private var supportSection: some View {
        Section("Support") {
            SettingsRow(
                title: "Help Center",
                icon: "questionmark.circle.fill",
                iconColor: .blue
            ) {
                // TODO: Open help center
            }

            SettingsRow(
                title: "Contact Support",
                icon: "envelope.fill",
                iconColor: .green
            ) {
                // TODO: Open contact support
            }

            SettingsRow(
                title: "Rate MealDino",
                icon: "star.fill",
                iconColor: .yellow
            ) {
                // TODO: Open App Store rating
            }

            SettingsRow(
                title: "About",
                icon: "info.circle.fill",
                iconColor: .gray
            ) {
                // TODO: Navigate to about screen
            }
        }
    }

    private var signOutSection: some View {
        Section {
            Button(action: {
                showingSignOutAlert = true
            }) {
                HStack {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .foregroundColor(.red)
                        .frame(width: 24)

                    Text("Sign Out")
                        .foregroundColor(.red)

                    Spacer()
                }
            }
        }
    }

    private var memberSinceText: String {
        // In a real app, you'd get this from the user's creation date
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: Date())
    }
}

struct SettingsRow: View {
    let title: String
    let icon: String
    let iconColor: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundColor(iconColor)
                    .frame(width: 24)

                Text(title)
                    .foregroundColor(.primary)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthenticationService())
}