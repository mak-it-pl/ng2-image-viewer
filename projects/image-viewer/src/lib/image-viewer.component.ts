import {
    AfterViewInit,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    Renderer2,
    SimpleChanges,
    ViewChild
} from '@angular/core';

import { ImageViewer, FullScreenViewer } from 'iv-viewer';
import { NgxExtendedPdfViewerComponent, NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';

/**
 * @author Breno Prata - 22/12/2017
 */
@Component({

    selector: 'app-image-viewer',

    templateUrl: './image-viewer.component.html',

    styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent implements OnChanges, OnInit, AfterViewInit {
    @ViewChild('extendedPdfViewer') extendedPdfViewer: any;

    BASE_64_IMAGE = 'data:image/png;base64,';
    BASE_64_PNG = `${this.BASE_64_IMAGE} `;
    ROTACAO_PADRAO_GRAUS = 90;

    @Input() idContainer;
    @Input() images: any[];
    @Input() rotate = true;
    @Input() download = true;
    @Input() fullscreen = true;
    @Input() resetZoom = true;
    @Input() loadOnInit = false;
    @Input() showOptions = true;
    @Input() zoomInButton = true;
    @Input() zoomOutButton = true;

    @Input() showPDFOnlyOption = true;
    @Input() primaryColor = '#0176bd';
    @Input() buttonsColor = 'white';
    @Input() buttonsHover = '#333333';
    @Input() defaultDownloadName = 'Image';
    @Input() rotateRightTooltipLabel = 'Rotate right';
    @Input() rotateLeftTooltipLabel = 'Rotate left';
    @Input() resetZoomTooltipLabel = 'Reset zoom';
    @Input() fullscreenTooltipLabel = 'Fullscreen';
    @Input() zoomInTooltipLabel = 'Zoom In';
    @Input() zoomOutTooltipLabel = 'Zoom Out';
    @Input() downloadTooltipLabel = 'Download';
    @Input() showPDFOnlyLabel = 'Show only PDF';
    @Input() openInNewTabTooltipLabel = 'Open in new tab';
    @Input() enableTooltip = true;

    @Output() onNext = new EventEmitter();
    @Output() onPrevious = new EventEmitter();

    viewer;
    wrapper;
    curSpan;
    viewerFullscreen;
    totalImagens: number;
    indexImagemAtual: number;
    rotacaoImagemAtual: number;
    stringDownloadImagem: string;
    isImagemVertical: boolean;
    showOnlyPDF = false;

    zoomPercent = 100;

    isPdfMode = false;
    pdfBlob: Blob;

    constructor(private renderer: Renderer2,
        private pdfViewerService: NgxExtendedPdfViewerService) { }

    ngOnInit() {
        if (this.loadOnInit) {
            this.isImagensPresentes();
        }
    }

    ngAfterViewInit() {
        this.inicializarCores();
        if (this.loadOnInit) {
            this.inicializarImageViewer();
            setTimeout(() => {
                this.showImage();
            }, 1000);
        }
    }

    private inicializarCores() {
        this.setStyleClass('inline-icon', 'background-color', this.primaryColor);
        this.setStyleClass('footer-info', 'background-color', this.primaryColor);
        this.setStyleClass('footer-icon', 'color', this.buttonsColor);
    }

    ngOnChanges(changes: SimpleChanges) {
        this.imagesChange(changes);
        this.primaryColorChange(changes);
        this.buttonsColorChange(changes);
        this.defaultDownloadNameChange(changes);
    }

    zoomIn() {
        this.zoomPercent += 10;
        this.viewer.zoom(this.zoomPercent);
    }

    zoomOut() {
        if (this.zoomPercent === 100) {

            return;
        }

        this.zoomPercent -= 10;

        if (this.zoomPercent < 0) {

            this.zoomPercent = 0;
        }

        this.viewer.zoom(this.zoomPercent);
    }

    primaryColorChange(changes: SimpleChanges) {
        if (changes['primaryColor'] || changes['showOptions']) {
            setTimeout(() => {
                this.setStyleClass('inline-icon', 'background-color', this.primaryColor);
                this.setStyleClass('footer-info', 'background-color', this.primaryColor);
            }, 350);
        }
    }

    buttonsColorChange(changes: SimpleChanges) {
        if (changes['buttonsColor'] || changes['rotate'] || changes['download']
            || changes['fullscreen']) {
            setTimeout(() => {

                this.setStyleClass('footer-icon', 'color', this.buttonsColor);
            }, 350);
        }
    }

    defaultDownloadNameChange(changes: SimpleChanges) {
        if (changes['defaultDownloadName']) {
            this.defaultDownloadName = this.defaultDownloadName;
        }
    }

    imagesChange(changes: SimpleChanges) {
        if (changes['images'] && this.isImagensPresentes()) {
            this.inicializarImageViewer();
            setTimeout(() => {
                this.showImage();
            }, 1000);
        }
    }

    isImagensPresentes() {
        return this.images
            && this.images.length > 0;
    }

    inicializarImageViewer() {

        this.indexImagemAtual = 1;
        this.rotacaoImagemAtual = 0;
        this.totalImagens = this.images.length;

        if (this.viewer) {

            this.wrapper.querySelector('.total').innerHTML = this.totalImagens;
            return;
        }

        this.wrapper = document.getElementById(`${this.idContainer}`);

        if (this.wrapper) {
            this.curSpan = this.wrapper.querySelector('#current');
            const imageContainer = this.wrapper.querySelector('.image-container');
            if (imageContainer) {
                const options = {
                    zoomValue: this.zoomPercent,
                    hasZoomButtons: this.zoomInButton || this.zoomOutButton,
                    zoomStep: 10,
                };
                this.viewer = new ImageViewer(imageContainer, options);
                this.wrapper.querySelector('.total').innerHTML = this.totalImagens;
            }
        }
    }

    showImage() {
        this.prepararTrocaImagem();

        let imgObj = this.BASE_64_PNG;
        if (this.isPDF()) {
            this.isPdfMode = true;
            this.carregarViewerPDF();
        } else if (this.isURlImagem()) {
            this.isPdfMode = false;
            imgObj = this.getImagemAtual();
            this.stringDownloadImagem = this.getImagemAtual();
        } else {
            this.isPdfMode = false;
            imgObj = this.BASE_64_PNG + this.getImagemAtual();
            this.stringDownloadImagem = this.BASE_64_IMAGE + this.getImagemAtual();
        }
        if (this.viewer) {
            this.viewer.load(imgObj, imgObj);
        }
        if (this.curSpan) {
            this.curSpan.innerHTML = this.indexImagemAtual;
        }
        this.inicializarCores();
    }

    carregarViewerPDF() {
        this.esconderBotoesImageViewer();
        this.pdfBlob = this.converterPDFBase64ParaBlob();
    }

    esconderBotoesImageViewer() {
        this.setStyleClass('iv-loader', 'visibility', 'hidden');
        this.setStyleClass('options-image-viewer', 'visibility', 'hidden');
    }

    isPDF() {
        return this.getImagemAtual().startsWith('JVBE') || this.getImagemAtual().startsWith('0M8R');
    }

    isURlImagem() {
        return this.getImagemAtual().match(new RegExp(/^(https|http|www\.)/g));
    }

    prepararTrocaImagem() {
        this.rotacaoImagemAtual = 0;
        this.limparCacheElementos();
    }

    limparCacheElementos() {
        if (!this.idContainer) {
            return;
        }

        const container = document.getElementById(this.idContainer);
        if (!container) {
            return;
        }

        const iframeElement = document.getElementById(this.getIdIframe());

        let ivLargeImage = null;
        try {
            ivLargeImage = container.getElementsByClassName('iv-large-image').item(0);
        } catch (e) {
            // Ignore errors if element not found
        }

        if (iframeElement && container) {
            this.renderer.removeChild(container, iframeElement);

            if (ivLargeImage) {
                this.renderer.removeChild(container, ivLargeImage);
            }
        }

        this.setStyleClass('iv-loader', 'visibility', 'auto');
        this.setStyleClass('options-image-viewer', 'visibility', 'inherit');
    }

    proximaImagem() {
        this.isImagemVertical = false;
        this.indexImagemAtual++;
        if (this.indexImagemAtual > this.totalImagens) {
            this.indexImagemAtual = 1;
        }
        this.onNext.emit(this.indexImagemAtual);
        if (!this.isPDF() && this.showOnlyPDF) {
            this.proximaImagem();
            return;
        }
        this.showImage();
    }

    imagemAnterior() {
        this.isImagemVertical = false;
        this.indexImagemAtual--;
        if (this.indexImagemAtual <= 0) {
            this.indexImagemAtual = this.totalImagens;
        }
        this.onPrevious.emit(this.indexImagemAtual);
        if (!this.isPDF() && this.showOnlyPDF) {
            this.imagemAnterior();
            return;
        }
        this.showImage();
    }

    rotacionarDireita() {
        const timeout = this.resetarZoom();
        setTimeout(() => {
            this.rotacaoImagemAtual += this.ROTACAO_PADRAO_GRAUS;
            this.isImagemVertical = !this.isImagemVertical;
            this.atualizarRotacao();
        }, timeout);
    }

    rotacionarEsquerda() {
        const timeout = this.resetarZoom();
        setTimeout(() => {
            this.rotacaoImagemAtual -= this.ROTACAO_PADRAO_GRAUS;
            this.isImagemVertical = !this.isImagemVertical;
            this.atualizarRotacao();
        }, timeout);
    }

    resetarZoom(): number {
        this.zoomPercent = 100;
        this.viewer.zoom(this.zoomPercent);
        let timeout = 800;
        if (this.viewer._state.zoomValue === this.zoomPercent) {
            timeout = 0;
        }
        return timeout;
    }

    atualizarRotacao(isAnimacao = true) {
        let scale = '';
        if (this.isImagemVertical && this.isImagemSobrepondoNaVertical()) {
            scale = `scale(${this.getScale()})`;
        }
        const novaRotacao = `rotate(${this.rotacaoImagemAtual}deg)`;
        this.carregarImagem(novaRotacao, scale, isAnimacao);
    }

    getScale() {
        if (!this.idContainer) {
            return 0.6;
        }

        const containerElement = document.getElementById(this.idContainer);
        if (!containerElement) {
            return 0.6;
        }

        let ivLargeImageElement = null;
        try {
            ivLargeImageElement = containerElement.getElementsByClassName('iv-large-image').item(0);
        } catch (e) {
            return 0.6;
        }

        if (!ivLargeImageElement) {
            return 0.6;
        }

        const diferencaTamanhoImagem = ivLargeImageElement.clientWidth - containerElement.clientHeight;

        if (diferencaTamanhoImagem >= 250 && diferencaTamanhoImagem < 300) {
            return (ivLargeImageElement.clientWidth - containerElement.clientHeight) / (containerElement.clientHeight) - 0.1;
        } else if (diferencaTamanhoImagem >= 300 && diferencaTamanhoImagem < 400) {
            return ((ivLargeImageElement.clientWidth - containerElement.clientHeight) / (containerElement.clientHeight)) - 0.15;
        } else if (diferencaTamanhoImagem >= 400) {
            return ((ivLargeImageElement.clientWidth - containerElement.clientHeight) / (containerElement.clientHeight)) - 0.32;
        }

        return 0.6;
    }

    isImagemSobrepondoNaVertical() {
        if (!this.idContainer) {
            return false;
        }

        const containerElement: Element = document.getElementById(this.idContainer);
        if (!containerElement) {
            return false;
        }

        const ivLargeImageElement: Element = containerElement.getElementsByClassName('iv-large-image').item(0);
        if (!ivLargeImageElement) {
            return false;
        }

        const margemErro = 5;
        return containerElement.clientHeight < ivLargeImageElement.clientWidth + margemErro;
    }

    carregarImagem(novaRotacao: string, scale: string, isAnimacao = true) {
        if (isAnimacao) {
            this.adicionarAnimacao('iv-snap-image');
            this.adicionarAnimacao('iv-large-image');
        }
        this.adicionarRotacao('iv-snap-image', novaRotacao, scale);
        this.adicionarRotacao('iv-large-image', novaRotacao, scale);
        setTimeout(() => {
            if (isAnimacao) {
                this.retirarAnimacao('iv-snap-image');
                this.retirarAnimacao('iv-large-image');
            }
        }, 501);
    }

    retirarAnimacao(componente: string) {
        this.setStyleClass(componente, 'transition', 'auto');
    }

    adicionarRotacao(componente: string, novaRotacao: string, scale: string) {
        this.setStyleClass(componente, 'transform', `${novaRotacao} ${scale}`);
    }

    adicionarAnimacao(componente: string) {
        this.setStyleClass(componente, 'transition', `0.5s linear`);
    }

    mostrarFullscreen() {
        const timeout = this.resetarZoom();
        setTimeout(() => {

            const options = {
                zoomValue: this.zoomPercent,
                hasZoomButtons: this.zoomInButton || this.zoomOutButton,
                zoomStep: 10,
            };
            this.viewerFullscreen = new FullScreenViewer(options);
            let imgSrc;

            if (this.isURlImagem()) {

                imgSrc = this.getImagemAtual();
            } else {

                imgSrc = this.BASE_64_PNG + this.getImagemAtual();
            }
            this.viewerFullscreen.show(imgSrc, imgSrc);
            this.atualizarRotacao(false);
        }, timeout);
    }

    converterPDFBase64ParaBlob() {

        const arrBuffer = this.base64ToArrayBuffer(this.getImagemAtual());

        return new Blob([arrBuffer], { type: 'application/pdf' });
    }

    private getImagemAtual() {
        if (!this.images || !this.images.length || this.indexImagemAtual <= 0 || this.indexImagemAtual > this.images.length) {
            return '';
        }
        return this.images[this.indexImagemAtual - 1];
    }

    base64ToArrayBuffer(data) {
        const binaryString = window.atob(data);
        const binaryLen = binaryString.length;
        const bytes = new Uint8Array(binaryLen);
        for (let i = 0; i < binaryLen; i++) {
            const ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }

    showPDFOnly() {
        this.showOnlyPDF = !this.showOnlyPDF;
        this.proximaImagem();
    }

    setStyleClass(nomeClasse: string, nomeStyle: string, cor: string) {
        if (!this.idContainer) {
            return;
        }

        const container = document.getElementById(this.idContainer);
        if (!container) {
            return;
        }

        let cont;
        const listaElementos = container.getElementsByClassName(nomeClasse);

        for (cont = 0; cont < listaElementos.length; cont++) {
            if (listaElementos.item(cont)) {
                this.renderer.setStyle(listaElementos.item(cont), nomeStyle, cor);
            }
        }
    }

    atualizarCorHoverIn(event: MouseEvent) {
        if (event && event.srcElement) {
            this.renderer.setStyle(event.srcElement, 'color', this.buttonsHover);
        }
    }

    atualizarCorHoverOut(event: MouseEvent) {
        if (event && event.srcElement) {
            this.renderer.setStyle(event.srcElement, 'color', this.buttonsColor);
        }
    }

    getIdIframe() {
        if (!this.idContainer) {
            return 'image-viewer-iframe';
        }
        return this.idContainer + '-iframe';
    }


    public onDownload() {
        if (this.extendedPdfViewer?.service?.PDFViewerApplication) {
            // Call the built-in download method
            this.extendedPdfViewer.service.PDFViewerApplication.download();
        } else {
            console.error('PDF Viewer service is not initialized.');
        }
    };

    public onPrint() {
        this.pdfViewerService.print();
    };
}
