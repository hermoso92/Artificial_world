import Foundation

extension Notification.Name {
    /// Recolección de fibra (cualquier agente; la UI filtra si hace falta).
    static let awGamePickupFiber = Notification.Name("awGamePickupFiber")
    /// Recolección de nutriente.
    static let awGamePickupNutrient = Notification.Name("awGamePickupNutrient")
    /// Craft o consumo exitoso del controlado. `userInfo["action"]`: `"craft"` | `"consume"`.
    static let awGameControlledSuccess = Notification.Name("awGameControlledSuccess")
    /// Intento fallido de craft o consumo (sin stock, coste, etc.).
    static let awGameControlledFailure = Notification.Name("awGameControlledFailure")
}
