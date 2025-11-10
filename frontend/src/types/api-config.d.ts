declare module '../config/api.config.js' {
  interface ApiClient {
    createGame(mode: string, difficulty?: string): Promise<any>;
    getGameStatus(gameId: string): Promise<any>;
    rollDice(gameId: string): Promise<any>;
    makeMove(gameId: string, from: number, to: number): Promise<any>;
    login(email: string, password: string): Promise<any>;
  }

  export const apiClient: ApiClient;
}
