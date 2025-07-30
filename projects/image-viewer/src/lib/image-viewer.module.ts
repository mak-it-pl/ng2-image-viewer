import {ModuleWithProviders, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ImageViewerComponent} from './image-viewer.component';
import {NgxExtendedPdfViewerModule} from 'ngx-extended-pdf-viewer';

export * from './image-viewer.component'

@NgModule({
    imports: [
      CommonModule,
      NgxExtendedPdfViewerModule
    ],
    declarations: [
        ImageViewerComponent
    ],
    exports: [
        ImageViewerComponent,
    ]
})
export class ImageViewerModule {
    static forRoot(): ModuleWithProviders<ImageViewerModule> {
        return {
            ngModule: ImageViewerModule,
        };
    }
}
