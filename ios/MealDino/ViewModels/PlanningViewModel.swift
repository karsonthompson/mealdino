import Foundation
import Combine

class PlanningViewModel: ObservableObject {
    @Published var mealPlans: [MealPlan] = []
    @Published var selectedDate = Date()
    @Published var currentWeekDates: [Date] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showingAddMeal = false
    @Published var selectedMealType: MealType?

    private let apiClient: APIClient
    private var cancellables = Set<AnyCancellable>()

    init(apiClient: APIClient = APIClient.shared) {
        self.apiClient = apiClient
        setupWeekDates()
        setupDateObserver()
    }

    func loadMealPlans() {
        isLoading = true
        errorMessage = nil

        let startDate = currentWeekDates.first?.toMealPlanDateString() ?? Date().toMealPlanDateString()
        let endDate = currentWeekDates.last?.toMealPlanDateString() ?? Date().toMealPlanDateString()

        apiClient.getMealPlans(startDate: startDate, endDate: endDate)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] mealPlans in
                    self?.mealPlans = mealPlans
                }
            )
            .store(in: &cancellables)
    }

    func addMeal(recipe: Recipe, to date: Date, mealType: MealType, notes: String = "", source: MealSource = .fresh) {
        let mealRequest = AddMealRequest(
            date: date.toMealPlanDateString(),
            meal: AddMealRequest.MealData(
                type: mealType.rawValue,
                recipe: recipe.id,
                notes: notes,
                source: source.rawValue
            )
        )

        apiClient.addMealToPlan(mealRequest)
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    if case .failure(let error) = completion {
                        self?.errorMessage = error.localizedDescription
                    }
                },
                receiveValue: { [weak self] mealPlan in
                    // Update or add the meal plan
                    if let index = self?.mealPlans.firstIndex(where: { $0.date == mealPlan.date }) {
                        self?.mealPlans[index] = mealPlan
                    } else {
                        self?.mealPlans.append(mealPlan)
                    }
                    self?.showingAddMeal = false
                }
            )
            .store(in: &cancellables)
    }

    func mealPlan(for date: Date) -> MealPlan? {
        return mealPlans.first { $0.date == date.toMealPlanDateString() }
    }

    func meals(for date: Date, mealType: MealType) -> [PlannedMeal] {
        return mealPlan(for: date)?.meals(for: mealType) ?? []
    }

    func hasMeal(for date: Date, mealType: MealType) -> Bool {
        return !meals(for: date, mealType: mealType).isEmpty
    }

    func totalCalories(for date: Date) -> Double {
        return mealPlan(for: date)?.totalCalories ?? 0
    }

    func navigateToWeek(_ direction: WeekNavigation) {
        let calendar = Calendar.current
        let daysToAdd = direction == .next ? 7 : -7

        if let newDate = calendar.date(byAdding: .day, value: daysToAdd, to: selectedDate) {
            selectedDate = newDate
        }
    }

    private func setupWeekDates() {
        currentWeekDates = selectedDate.daysInCurrentWeek()
    }

    private func setupDateObserver() {
        $selectedDate
            .sink { [weak self] newDate in
                self?.currentWeekDates = newDate.daysInCurrentWeek()
                self?.loadMealPlans()
            }
            .store(in: &cancellables)
    }

    // MARK: - Helper Methods
    func openAddMeal(for date: Date, mealType: MealType) {
        selectedDate = date
        selectedMealType = mealType
        showingAddMeal = true
    }
}

enum WeekNavigation {
    case previous
    case next
}