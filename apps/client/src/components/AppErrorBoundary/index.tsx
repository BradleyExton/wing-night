import { Component, type ErrorInfo, type ReactNode } from "react";

import { scheduleCrashRecoveryReload } from "../../utils/scheduleCrashRecoveryReload";
import type { AppCrashSurface } from "./copy";
import { CrashNotice } from "./CrashNotice";
import * as styles from "./styles";

// The one thing standing between a thrown render and a bare white #root.
//
// Every route is behind React.lazy, and React.lazy CACHES its rejection: once a
// route chunk fails to arrive, every later render re-throws the same error. With
// nothing catching it, React 18 unmounts the whole root — on the TV that is a
// white 55" screen in front of the room, fixable only by finding a keyboard.
// Before the routes were split this could not happen, because the route lived in
// the entry bundle; splitting them is what made a boundary load-bearing.
//
// It sits around RouteContent rather than at createRoot so it knows which
// surface crashed. A TV and a host tablet want different words and different
// type sizes for the same failure.

type AppErrorBoundaryProps = {
  surface: AppCrashSurface;
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasCaughtError: boolean;
  isRecoveryReloadScheduled: boolean;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public override state: AppErrorBoundaryState = {
    hasCaughtError: false,
    isRecoveryReloadScheduled: false
  };

  public static getDerivedStateFromError(): Partial<AppErrorBoundaryState> {
    return { hasCaughtError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // The console is the only log the client has, and a crash on the TV is
    // exactly the thing someone will come looking for afterwards.
    console.error("app:crash", error, errorInfo.componentStack);

    // Re-rendering cannot clear a cached React.lazy rejection, so recovery is a
    // reload or nothing. It happens at most once per page session — see the
    // util for why the guard matters more than the reload.
    this.setState({ isRecoveryReloadScheduled: scheduleCrashRecoveryReload() });
  }

  private readonly handleReload = (): void => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (!this.state.hasCaughtError) {
      return this.props.children;
    }

    return (
      <div className={styles.sheet}>
        <CrashNotice
          surface={this.props.surface}
          isRecoveryReloadScheduled={this.state.isRecoveryReloadScheduled}
          onReload={this.handleReload}
        />
      </div>
    );
  }
}
