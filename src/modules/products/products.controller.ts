import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Get,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
            const ext = extname(file.originalname);
            callback(null, `products-${Date.now()}${ext}`);
            },
        }),
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        // Call the service to process CSV file
        return this.productsService.processCSV(file.path);
    }

    @Get()
    async getAllProducts(
        @Query('name') name?: string,
        @Query('price') price?: number,
        @Query('expiration') expiration?: string,
        @Query('page') page?: number,
        @Query('pagesize') pageSize?: number,
        @Query('order') order?: 'ASC' | 'DESC',
        @Query('orderby') orderBy?: 'name' | 'price' | 'expiration',
    ) {
        return this.productsService.getProducts(name, price, expiration, page, pageSize, order, orderBy);
    }
}
  