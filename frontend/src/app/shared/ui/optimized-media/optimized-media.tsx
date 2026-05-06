import { Component, createRef, ReactNode, RefObject } from "react";

import { className } from "@/app/shared/utils/functions/className";

import styles from "./optimized-media.module.scss";

type BaseProps = {
    className?: string;
    alt?: string;
    src?: string;
    loading?: "lazy" | "eager";
    fetchPriority?: "high" | "low" | "auto";
    draggable?: boolean;
    srcSet?: string;
    sizes?: string;
    onMediaLoad?: () => void;
};

type ImageProps = BaseProps & {
    type?: "image";
};

type VideoProps = BaseProps & {
    type: "video";
    poster?: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    playsInline?: boolean;
    children?: ReactNode;
};

export type OptimizedMediaProps = ImageProps | VideoProps;

const loadedUrls: Set<string> = new Set();

interface State {
    loaded: boolean;
}

export class OptimizedMedia extends Component<OptimizedMediaProps, State> {
    state: State = { loaded: false };
    private imgRef: RefObject<HTMLImageElement> = createRef();
    private videoRef: RefObject<HTMLVideoElement> = createRef();

    componentDidMount(): void {
        this.checkAlreadyLoaded();
    }

    componentDidUpdate(prevProps: OptimizedMediaProps): void {
        if (prevProps.src !== this.props.src) {
            this.setState({ loaded: false }, () => {
                this.checkAlreadyLoaded();
            });
        }
    }

    private checkAlreadyLoaded(): void {
        if (this.state.loaded) return;

        if (this.props.type === "video") {
            const video: HTMLVideoElement | null = this.videoRef.current;
            if (video && video.readyState >= 2) {
                this.handleLoad();
            }
        } else {
            const img: HTMLImageElement | null = this.imgRef.current;
            if (img && img.complete && img.naturalWidth > 0) {
                this.handleLoad();
            }
        }
    }

    private handleLoad = (): void => {
        if (this.state.loaded) return;
        if (this.props.src) loadedUrls.add(this.props.src);
        this.setState({ loaded: true });
        this.props.onMediaLoad?.();
    };

    private renderImage(): ReactNode {
        const {
            src,
            alt,
            loading = "lazy",
            fetchPriority,
            draggable,
            srcSet,
            sizes,
        } = this.props as ImageProps;

        return (
            <img
                ref={this.imgRef}
                className={styles["media"]}
                src={src}
                alt={alt ?? ""}
                loading={loading}
                decoding="async"
                fetchPriority={fetchPriority}
                srcSet={srcSet}
                sizes={sizes}
                draggable={draggable}
                onLoad={this.handleLoad}
            />
        );
    }

    private renderVideo(): ReactNode {
        const {
            src,
            poster,
            autoPlay,
            muted,
            loop,
            playsInline,
            children,
            alt,
        } = this.props as VideoProps;

        return (
            <video
                ref={this.videoRef}
                className={styles["media"]}
                src={src}
                poster={poster}
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                playsInline={playsInline}
                aria-label={alt}
                onLoadedData={this.handleLoad}
                onCanPlay={this.handleLoad}
            >
                {children}
            </video>
        );
    }

    render(): ReactNode {
        const isVideo: boolean = this.props.type === "video";
        const isLoaded: boolean = this.state.loaded || (!!this.props.src && loadedUrls.has(this.props.src));
        const wrapperClass: string = className(styles["optimized-media"], {
            [styles["optimized-media--loaded"]]: isLoaded,
            [this.props.className!]: !!this.props.className,
        });

        return (
            <div className={wrapperClass}>
                {!isLoaded && <div className={styles["skeleton"]} />}
                {isVideo ? this.renderVideo() : this.renderImage()}
            </div>
        );
    }
}
