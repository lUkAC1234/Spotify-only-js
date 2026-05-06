import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { Outlet } from "react-router";

import { _static } from "@/app/shared/decorators/static";
import { BottomPlayer } from "@/app/shared/ui/bottom-player/bottom-player";
import { QueuePanel } from "@/app/shared/ui/queue-panel/queue-panel";
import { Sidebar } from "@/app/shared/ui/sidebar/sidebar";
import { TopNav } from "@/app/shared/ui/top-nav/top-nav";

import styles from "./shell-layout.module.scss";

@_static
@observer
export class ShellLayout extends Component {
    render(): ReactNode {
        return (
            <div className={styles["shell"]}>
                <aside className={styles["shell__sidebar"]}>
                    <Sidebar />
                </aside>
                <header className={styles["shell__topnav"]}>
                    <TopNav />
                </header>
                <main className={styles["shell__main"]}>
                    <Outlet />
                </main>
                <footer className={styles["shell__player"]}>
                    <BottomPlayer />
                </footer>
                <QueuePanel />
            </div>
        );
    }
}
